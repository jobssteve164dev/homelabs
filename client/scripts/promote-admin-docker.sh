#!/bin/bash
# Docker容器内管理员提升包装脚本
# 自动加载环境变量并执行TypeScript脚本

set -e

# 从环境变量构建DATABASE_URL（如果未设置）
if [ -z "$DATABASE_URL" ]; then
    POSTGRES_USER="${POSTGRES_USER:-homelabs}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-homelabs_password}"
    POSTGRES_DB="${POSTGRES_DB:-homelabs_portal}"
    
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"
    echo "ℹ️  已自动设置 DATABASE_URL"
fi

# 检查是否提供了邮箱参数
if [ -z "$1" ]; then
    echo "用法: $0 <email>"
    echo "示例: $0 admin@example.com"
    exit 1
fi

# 执行TypeScript脚本
npx tsx "$(dirname "$0")/promote-admin.ts" "$1"

