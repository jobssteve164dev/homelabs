#!/bin/sh
set -e

echo "🚀 启动应用容器..."

# 检查Prisma是否可用
PRISMA_CMD=""

# 优先使用Prisma的入口文件（最可靠的方法）
if [ -f "node_modules/prisma/build/index.js" ]; then
  PRISMA_CMD="node node_modules/prisma/build/index.js"
  echo "✅ 使用Prisma CLI: node_modules/prisma/build/index.js"
elif [ -f "node_modules/.bin/prisma" ]; then
  # 如果.bin目录存在，尝试使用它
  PRISMA_CMD="node node_modules/.bin/prisma"
  echo "✅ 使用Prisma CLI: node_modules/.bin/prisma"
elif command -v npx > /dev/null 2>&1; then
  PRISMA_CMD="npx prisma"
  echo "✅ 使用npx执行Prisma"
else
  echo "⚠️  警告: 未找到Prisma命令，跳过数据库初始化"
  echo "调试信息:"
  echo "  - node_modules/prisma/build/index.js: $([ -f "node_modules/prisma/build/index.js" ] && echo '存在' || echo '不存在')"
  echo "  - node_modules/.bin/prisma: $([ -f "node_modules/.bin/prisma" ] && echo '存在' || echo '不存在')"
  echo "  - node_modules/prisma: $([ -d "node_modules/prisma" ] && echo '存在' || echo '不存在')"
  echo "  - npx: $(command -v npx || echo '未找到')"
  PRISMA_CMD=""
fi

# 等待数据库就绪并初始化（最多等待30秒）
if [ -n "$PRISMA_CMD" ]; then
  echo "⏳ 等待数据库连接并初始化..."
  MAX_RETRIES=15
  RETRY_COUNT=0
  DB_INITIALIZED=false

  while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$DB_INITIALIZED" != "true" ]; do
    # 尝试初始化数据库
    if $PRISMA_CMD db push --accept-data-loss --skip-generate > /tmp/prisma-init.log 2>&1; then
      echo "✅ 数据库已就绪并初始化完成"
      DB_INITIALIZED=true
      break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "等待数据库... ($RETRY_COUNT/$MAX_RETRIES)"
      # 显示最后一次的错误信息
      if [ $RETRY_COUNT -gt 1 ]; then
        echo "  上次错误: $(tail -1 /tmp/prisma-init.log 2>/dev/null || echo '未知错误')"
      fi
      sleep 2
    fi
  done

  if [ "$DB_INITIALIZED" != "true" ]; then
    echo "⚠️  数据库连接超时，尝试最后一次初始化..."
    echo "详细错误信息:"
    cat /tmp/prisma-init.log 2>/dev/null || echo "无法读取错误日志"
    $PRISMA_CMD db push --accept-data-loss --skip-generate || {
      echo "❌ 数据库初始化失败，但继续启动应用..."
      echo "请检查:"
      echo "  1. DATABASE_URL环境变量是否正确"
      echo "  2. 数据库服务是否正在运行"
      echo "  3. 网络连接是否正常"
    }
  fi
else
  echo "⚠️  跳过数据库初始化（Prisma不可用）"
fi

# 验证Prisma客户端是否已生成
if [ ! -d "node_modules/.prisma/client" ] && [ -n "$PRISMA_CMD" ]; then
  echo "🔄 生成Prisma客户端..."
  $PRISMA_CMD generate || {
    echo "⚠️  Prisma客户端生成失败，但继续启动..."
  }
fi

# 启动应用
echo "🚀 启动Next.js应用..."
exec node server.js

