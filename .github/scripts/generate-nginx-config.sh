#!/bin/bash
# 生成本地部署 Nginx 配置文件
# 用法: ./generate-nginx-config.sh <output_file>

set -e

OUTPUT_FILE="${1:-nginx-auto.conf}"

# 从环境变量读取配置
DEPLOY_ENVIRONMENT="${DEPLOY_ENVIRONMENT:-local}"
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-localhost}"
ADDITIONAL_DOMAINS="${ADDITIONAL_DOMAINS:-}"
USE_SSL="${USE_SSL:-false}"
NGINX_PORT="${NGINX_PORT:-80}"
APP_PORT="${APP_PORT:-3000}"
BEHIND_PROXY="${BEHIND_PROXY:-false}"
PROXY_IP="${PROXY_REAL_IP_FROM:-192.168.0.0/16}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/homelabs}"

echo "==================================="
echo "生成Nginx配置文件..."
echo "==================================="
echo "配置参数:"
echo "  部署环境: $DEPLOY_ENVIRONMENT"
echo "  主域名: $PRIMARY_DOMAIN"
echo "  备用域名: $ADDITIONAL_DOMAINS"
echo "  SSL启用: $USE_SSL"
echo "  Nginx端口: $NGINX_PORT"
echo "  应用端口: $APP_PORT"
echo "  反向代理: $BEHIND_PROXY"
echo ""

# 生成Nginx配置
cat > "$OUTPUT_FILE" <<'NGINX_HEADER'
# HOMELABS Portal Nginx配置
# 自动生成 - 请勿手动编辑

server {
NGINX_HEADER

# 构建server_name
SERVER_NAMES="$PRIMARY_DOMAIN"
if [ -n "$ADDITIONAL_DOMAINS" ]; then
  SERVER_NAMES="$SERVER_NAMES $ADDITIONAL_DOMAINS"
fi

# 根据环境和SSL设置决定监听端口
if [ "$DEPLOY_ENVIRONMENT" = "production" ] && [ "$USE_SSL" = "true" ]; then
  cat >> "$OUTPUT_FILE" <<NGINX_SSL
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
    ssl_certificate /etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${PRIMARY_DOMAIN}/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/${PRIMARY_DOMAIN}/chain.pem;

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
  cat >> "$OUTPUT_FILE" <<NGINX_HTTP
    # HTTP配置
    listen ${NGINX_PORT};
    listen [::]:${NGINX_PORT};
    server_name ${SERVER_NAMES};
NGINX_HTTP
fi

# 添加反向代理真实IP处理（如果启用）
if [ "$BEHIND_PROXY" = "true" ]; then
  cat >> "$OUTPUT_FILE" <<NGINX_PROXY

    # 反向代理真实IP处理
    set_real_ip_from ${PROXY_IP};
    real_ip_header X-Forwarded-For;
    real_ip_recursive on;
NGINX_PROXY
fi

# 继续生成Nginx配置
cat >> "$OUTPUT_FILE" <<NGINX_MAIN

    # Next.js应用代理
    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 86400;
    }

    # 静态资源优化
    location /_next/static/ {
        proxy_pass http://localhost:${APP_PORT};
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 图片优化
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://localhost:${APP_PORT};
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 日志配置
    access_log ${DEPLOY_PATH}/logs/nginx-access.log;
    error_log ${DEPLOY_PATH}/logs/nginx-error.log warn;
}
NGINX_MAIN

echo "✅ Nginx配置文件生成完成: $OUTPUT_FILE"
echo ""

