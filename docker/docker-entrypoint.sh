#!/bin/sh
set -e

echo "🚀 启动应用容器..."

# 等待数据库就绪并初始化（最多等待30秒）
echo "⏳ 等待数据库连接并初始化..."
MAX_RETRIES=15
RETRY_COUNT=0
DB_INITIALIZED=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$DB_INITIALIZED" != "true" ]; do
  # 尝试初始化数据库
  if node node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate > /dev/null 2>&1; then
    echo "✅ 数据库已就绪并初始化完成"
    DB_INITIALIZED=true
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "等待数据库... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
  fi
done

if [ "$DB_INITIALIZED" != "true" ]; then
  echo "⚠️  数据库连接超时，尝试最后一次初始化..."
  node node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate || {
    echo "❌ 数据库初始化失败，但继续启动应用..."
  }
fi

# 启动应用
echo "🚀 启动Next.js应用..."
exec node server.js

