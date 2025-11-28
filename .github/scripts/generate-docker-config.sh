#!/bin/bash
# 生成 Docker 部署配置文件
# 用法: ./generate-docker-config.sh <output_dir>
# 
# 支持两种部署架构:
#   - multi-container: 多容器模式 (PostgreSQL + Redis + App + Nginx 分离)
#   - all-in-one: 单容器模式 (PostgreSQL + App 合并)
#
# Nginx 选项:
#   - USE_NGINX=true: 启用 Nginx 反向代理（适合生产环境）
#   - USE_NGINX=false: 不使用 Nginx，直接暴露应用端口（适合开发/测试或已有外部代理）

set -e

OUTPUT_DIR="${1:-.}"

# 从环境变量读取配置
DEPLOY_ENVIRONMENT="${DEPLOY_ENVIRONMENT:-local}"
DEPLOY_ARCHITECTURE="${DEPLOY_ARCHITECTURE:-all-in-one}"  # 默认使用 all-in-one 模式
USE_NGINX="${USE_NGINX:-false}"  # 默认不使用 Nginx
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
echo "  部署架构: $DEPLOY_ARCHITECTURE"
echo "  启用Nginx: $USE_NGINX"
echo "  应用端口: $APP_PORT"
if [ "$USE_NGINX" = "true" ]; then
  echo "  Nginx端口: $NGINX_PORT"
  echo "  Nginx(SSL)端口: $NGINX_SSL_PORT (仅在 USE_SSL=true 时启用)"
  echo "  主域名: $PRIMARY_DOMAIN"
  echo "  备用域名: $ADDITIONAL_DOMAINS"
  echo "  SSL启用: $USE_SSL"
  echo "  反向代理: $BEHIND_PROXY"
fi
if [ "$DEPLOY_ARCHITECTURE" = "multi-container" ]; then
  echo "  Postgres宿主端口: $POSTGRES_HOST_PORT"
  echo "  Redis宿主端口: $REDIS_HOST_PORT"
fi
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
echo "生成 docker-compose.yml (架构: $DEPLOY_ARCHITECTURE)..."

if [ "$DEPLOY_ARCHITECTURE" = "all-in-one" ]; then
  # ========================================
  # All-in-One 模式: PostgreSQL + App 在同一容器
  # ========================================
  
  if [ "$USE_NGINX" = "true" ]; then
    # ========================================
    # All-in-One + Nginx 模式
    # ========================================
    cat > "$OUTPUT_DIR/docker-compose-auto.yml" <<EOF
# ========================================
# All-in-One 部署模式 (带 Nginx)
# ========================================
# PostgreSQL 和 Next.js 应用运行在同一个容器中
# Nginx 作为反向代理提供 SSL 终结和静态资源缓存
# 
# 架构: 用户 → Nginx (80/443) → App (3000) → PostgreSQL (内部)
#
# 日志系统:
#   - /app/logs/postgresql/  PostgreSQL 日志
#   - /app/logs/app/         Next.js 应用日志
#   - /app/logs/combined.log 组合日志

services:
  # All-in-One 应用 (PostgreSQL + Next.js)
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile.allinone
    container_name: homelabs-app
    restart: unless-stopped
    # 不直接暴露端口，通过 Nginx 代理
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - LOGS_DIR=/app/logs
      - LOG_LEVEL=${LOG_LEVEL}
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - APP_URL=${APP_URL}
      - DEBUG=\${DEBUG:-false}
    networks:
      - homelabs-network
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - app_logs:/app/logs
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

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
      app:
        condition: service_healthy
    networks:
      - homelabs-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "3"

volumes:
  postgres_data:
    name: homelabs-postgres-data
  app_logs:
    name: homelabs-app-logs
  nginx_logs:
    name: homelabs-nginx-logs

networks:
  homelabs-network:
    driver: bridge
    name: homelabs-network
EOF

  else
    # ========================================
    # All-in-One 纯净模式（无 Nginx）
    # ========================================
    cat > "$OUTPUT_DIR/docker-compose-auto.yml" <<EOF
# ========================================
# All-in-One 部署模式 (纯净版)
# ========================================
# 最简配置：只有一个容器包含 PostgreSQL + Next.js
# 
# 适用场景:
#   - 开发/测试环境
#   - 已有外部反向代理（如 Nginx、Traefik、Caddy）
#   - 轻量级私域部署
#
# 架构: 用户 → App (${APP_PORT}) → PostgreSQL (内部)
#
# 日志系统:
#   - /app/logs/postgresql/  PostgreSQL 日志
#   - /app/logs/app/         Next.js 应用日志
#   - /app/logs/combined.log 组合日志
#
# 查看日志:
#   docker compose logs -f app
#   docker compose exec app tail -f /app/logs/combined.log

services:
  # All-in-One 应用 (PostgreSQL + Next.js)
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile.allinone
    container_name: homelabs-app
    restart: unless-stopped
    ports:
      - "${APP_PORT}:3000"
    environment:
      - NODE_ENV=production
      - LOGS_DIR=/app/logs
      - LOG_LEVEL=${LOG_LEVEL}
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - APP_URL=${APP_URL}
      - DEBUG=\${DEBUG:-false}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - app_logs:/app/logs
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

volumes:
  postgres_data:
    name: homelabs-postgres-data
  app_logs:
    name: homelabs-app-logs
EOF

  fi

else
  # ========================================
  # Multi-Container 模式: 传统分离架构
  # ========================================
  cat > "$OUTPUT_DIR/docker-compose-auto.yml" <<EOF
# Multi-Container 部署模式
# PostgreSQL、Redis、App、Nginx 分离部署

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
      - LOGS_DIR=/app/logs
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - APP_URL=${APP_URL}
      - LOG_LEVEL=${LOG_LEVEL}
      - REDIS_URL=redis://redis:6379
      # 调试模式: 设置为 true 可在API响应中看到详细错误信息
      - DEBUG=\${DEBUG:-false}
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

fi

echo "✅ docker-compose.yml 生成完成 (架构: $DEPLOY_ARCHITECTURE)"

# ========================================
# 生成 nginx.conf（仅当启用 Nginx 时）
# ========================================
if [ "$USE_NGINX" = "true" ] || [ "$DEPLOY_ARCHITECTURE" = "multi-container" ]; then
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
        
        # Content Security Policy (允许Google Fonts和阿里云字体)
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com https://at.alicdn.com; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';" always;
        
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
else
  echo "⏭️  跳过 nginx.conf 生成（USE_NGINX=false）"
fi

echo ""
echo "==================================="
echo "✅ 所有配置文件生成完成！"
echo "==================================="
echo "输出目录: $OUTPUT_DIR"
echo "  - docker-compose-auto.yml"
if [ "$USE_NGINX" = "true" ] || [ "$DEPLOY_ARCHITECTURE" = "multi-container" ]; then
  echo "  - docker/nginx-auto.conf"
fi
echo ""
echo "部署架构: $DEPLOY_ARCHITECTURE"
if [ "$DEPLOY_ARCHITECTURE" = "all-in-one" ]; then
  echo "  📦 使用 Dockerfile.allinone (PostgreSQL + App 合并)"
  echo "  ✅ 数据库连接使用 localhost，无需跨容器通信"
  if [ "$USE_NGINX" = "true" ]; then
    echo "  🌐 Nginx 反向代理: 已启用"
  else
    echo "  🚀 纯净模式: 无 Nginx，直接暴露端口 $APP_PORT"
  fi
else
  echo "  📦 使用传统 Dockerfile (多容器分离)"
  echo "  ⚠️  数据库连接使用容器名称，需要 Docker 网络"
fi
