#!/bin/bash
# 生成 Docker 部署配置文件
# 用法: ./generate-docker-config.sh <output_dir>

set -e

OUTPUT_DIR="${1:-.}"

# 从环境变量读取配置
DEPLOY_ENVIRONMENT="${DEPLOY_ENVIRONMENT:-local}"
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-localhost}"
ADDITIONAL_DOMAINS="${ADDITIONAL_DOMAINS:-}"
USE_SSL="${USE_SSL:-false}"
NGINX_PORT="${NGINX_PORT:-80}"
APP_PORT="${APP_PORT:-3000}"
BEHIND_PROXY="${BEHIND_PROXY:-false}"
PROXY_IP="${PROXY_REAL_IP_FROM:-192.168.0.0/16}"

# 宿主机端口（可自定义，避免冲突）
POSTGRES_HOST_PORT="${POSTGRES_HOST_PORT:-15432}"
REDIS_HOST_PORT="${REDIS_HOST_PORT:-16379}"
NGINX_SSL_PORT="${NGINX_SSL_PORT:-443}"

# 数据库配置
POSTGRES_DB="${POSTGRES_DB:-homelabs_portal}"
POSTGRES_USER="${POSTGRES_USER:-homelabs}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"

# NextAuth配置
NEXTAUTH_URL="${NEXTAUTH_URL}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# 应用配置
APP_URL="${APP_URL}"
LOG_LEVEL="${LOG_LEVEL:-info}"

echo "==================================="
echo "生成 Docker 配置文件..."
echo "==================================="
echo "配置参数:"
echo "  部署环境: $DEPLOY_ENVIRONMENT"
echo "  主域名: $PRIMARY_DOMAIN"
echo "  备用域名: $ADDITIONAL_DOMAINS"
echo "  SSL启用: $USE_SSL"
echo "  Nginx端口: $NGINX_PORT"
echo "  Nginx(SSL)端口: $NGINX_SSL_PORT (仅在 USE_SSL=true 时启用)"
echo "  应用端口: $APP_PORT"
echo "  Postgres宿主端口: $POSTGRES_HOST_PORT"
echo "  Redis宿主端口: $REDIS_HOST_PORT"
echo "  反向代理: $BEHIND_PROXY"
echo ""

# 确保输出目录存在
mkdir -p "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/docker"

# 计算 Nginx 端口映射（根据是否启用 SSL 决定是否映射 443）
NGINX_PORTS="      - \"${NGINX_PORT}:80\""
if [ "$USE_SSL" = "true" ]; then
  NGINX_PORTS="${NGINX_PORTS}
      - \"${NGINX_SSL_PORT}:443\""
fi

# ========================================
# 生成 docker-compose.yml
# ========================================
echo "生成 docker-compose.yml..."
cat > "$OUTPUT_DIR/docker-compose-auto.yml" <<EOF
services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: homelabs-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "${POSTGRES_HOST_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - homelabs-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存 (可选)
  redis:
    image: redis:7-alpine
    container_name: homelabs-redis
    restart: unless-stopped
    ports:
      - "${REDIS_HOST_PORT}:6379"
    volumes:
      - redis_data:/data
    networks:
      - homelabs-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Next.js 应用
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: homelabs-app
    restart: unless-stopped
    ports:
      - "${APP_PORT}:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - APP_URL=${APP_URL}
      - LOG_LEVEL=${LOG_LEVEL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - homelabs-network
    volumes:
      - app_logs:/app/logs
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: homelabs-nginx
    restart: unless-stopped
    ports:
${NGINX_PORTS}
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - homelabs-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  app_logs:
  nginx_logs:

networks:
  homelabs-network:
    driver: bridge
EOF

echo "✅ docker-compose.yml 生成完成"

# ========================================
# 生成 nginx.conf
# ========================================
echo "生成 nginx.conf..."

# 构建 server_name
SERVER_NAMES="$PRIMARY_DOMAIN"
if [ -n "$ADDITIONAL_DOMAINS" ]; then
  SERVER_NAMES="$SERVER_NAMES $ADDITIONAL_DOMAINS"
fi

# 生成基础配置
cat > "$OUTPUT_DIR/docker/nginx-auto.conf" <<'NGINX_BASE'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # HOMELABS Portal Nginx配置
    server {
NGINX_BASE

# 根据环境和SSL设置决定监听端口
if [ "$DEPLOY_ENVIRONMENT" = "production" ] && [ "$USE_SSL" = "true" ]; then
  cat >> "$OUTPUT_DIR/docker/nginx-auto.conf" <<NGINX_SSL
        # HTTP重定向到HTTPS
        listen 80;
        listen [::]:80;
        server_name ${SERVER_NAMES};
        return 301 https://\$server_name\$request_uri;
    }

    server {
        # HTTPS配置
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name ${SERVER_NAMES};

        # SSL证书配置
        ssl_certificate /etc/nginx/ssl/${PRIMARY_DOMAIN}/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/${PRIMARY_DOMAIN}/privkey.pem;
        ssl_trusted_certificate /etc/nginx/ssl/${PRIMARY_DOMAIN}/chain.pem;

        # SSL安全配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 安全头
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options SAMEORIGIN always;
        add_header X-Content-Type-Options nosniff always;
NGINX_SSL
else
  cat >> "$OUTPUT_DIR/docker/nginx-auto.conf" <<NGINX_HTTP
        # HTTP配置
        listen 80;
        listen [::]:80;
        server_name ${SERVER_NAMES};
NGINX_HTTP
fi

# 添加反向代理真实IP处理（如果启用）
if [ "$BEHIND_PROXY" = "true" ]; then
  cat >> "$OUTPUT_DIR/docker/nginx-auto.conf" <<NGINX_PROXY

        # 反向代理真实IP处理
        set_real_ip_from ${PROXY_IP};
        real_ip_header X-Forwarded-For;
        real_ip_recursive on;
NGINX_PROXY
fi

# 继续生成Nginx配置
cat >> "$OUTPUT_DIR/docker/nginx-auto.conf" <<'NGINX_MAIN'

        # 完整安全头配置
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Content Security Policy
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';" always;
        
        # Permissions Policy
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

        # 静态资源优化
        location /_next/static/ {
            proxy_pass http://app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 图片优化
        location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
            proxy_pass http://app;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # API路由
        location /api/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_buffering off;
            proxy_read_timeout 86400;
        }

        # 主应用
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_buffering off;
            proxy_read_timeout 86400;
        }

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # 日志配置
        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log warn;
    }
}
NGINX_MAIN

echo "✅ nginx.conf 生成完成"
echo ""
echo "==================================="
echo "✅ 所有配置文件生成完成！"
echo "==================================="
echo "输出目录: $OUTPUT_DIR"
echo "  - docker-compose-auto.yml"
echo "  - docker/nginx-auto.conf"

