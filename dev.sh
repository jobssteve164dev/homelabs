#!/bin/bash

# 科幻未来风私域AI工具门户网站 - 开发环境启动脚本
# 作者: AI Assistant
# 日期: 2025-01-16

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🚀 HOMELABS PORTAL 🚀                    ║"
    echo "║              科幻未来风私域AI工具门户网站                    ║"
    echo "║                    Development Environment                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查依赖
check_dependencies() {
    print_message "🔍 检查系统依赖..." $BLUE
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_message "❌ Node.js 未安装，请先安装 Node.js 18+ 版本" $RED
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_message "❌ Node.js 版本过低，需要 18+ 版本，当前版本: $(node -v)" $RED
        exit 1
    fi
    
    print_message "✅ Node.js 版本检查通过: $(node -v)" $GREEN
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_message "❌ npm 未安装" $RED
        exit 1
    fi
    
    print_message "✅ npm 版本: $(npm -v)" $GREEN
    
    # 检查 PostgreSQL (可选)
    if command -v psql &> /dev/null; then
        print_message "✅ PostgreSQL 已安装" $GREEN
    else
        print_message "⚠️  PostgreSQL 未安装，将使用 Docker 容器" $YELLOW
    fi
    
    # 检查 Docker (可选)
    if command -v docker &> /dev/null; then
        print_message "✅ Docker 已安装" $GREEN
    else
        print_message "⚠️  Docker 未安装，请确保数据库服务可用" $YELLOW
    fi
}

# 检查端口占用
check_ports() {
    print_message "🔍 检查端口占用..." $BLUE
    
    # 检查 3000 端口
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_message "⚠️  端口 3000 已被占用，正在尝试释放..." $YELLOW
        PID=$(lsof -Pi :3000 -sTCP:LISTEN -t)
        if [ ! -z "$PID" ]; then
            kill -9 $PID 2>/dev/null || true
            sleep 2
            print_message "✅ 端口 3000 已释放" $GREEN
        fi
    else
        print_message "✅ 端口 3000 可用" $GREEN
    fi
    
    # 检查 5432 端口 (PostgreSQL)
    if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_message "✅ PostgreSQL 服务已运行" $GREEN
    else
        print_message "⚠️  PostgreSQL 服务未运行，将尝试启动 Docker 容器" $YELLOW
        start_postgres_docker
    fi
}

# 启动 PostgreSQL Docker 容器
start_postgres_docker() {
    if command -v docker &> /dev/null; then
        print_message "🐳 启动 PostgreSQL Docker 容器..." $BLUE
        
        # 检查容器是否已存在
        if docker ps -a --format 'table {{.Names}}' | grep -q "homelabs-postgres"; then
            print_message "🔄 重启现有 PostgreSQL 容器..." $YELLOW
            docker start homelabs-postgres
        else
            print_message "🆕 创建新的 PostgreSQL 容器..." $BLUE
            docker run -d \
                --name homelabs-postgres \
                -e POSTGRES_DB=homelabs_portal \
                -e POSTGRES_USER=postgres \
                -e POSTGRES_PASSWORD=password \
                -p 5432:5432 \
                postgres:15
        fi
        
        # 等待数据库启动
        print_message "⏳ 等待数据库启动..." $YELLOW
        sleep 5
        
        # 检查数据库连接
        if docker exec homelabs-postgres pg_isready -U postgres >/dev/null 2>&1; then
            print_message "✅ PostgreSQL 数据库已就绪" $GREEN
        else
            print_message "❌ PostgreSQL 数据库启动失败" $RED
            exit 1
        fi
    else
        print_message "❌ Docker 未安装，无法启动 PostgreSQL 容器" $RED
        print_message "请手动启动 PostgreSQL 服务或安装 Docker" $YELLOW
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    print_message "📦 安装项目依赖..." $BLUE
    
    cd client
    
    if [ ! -d "node_modules" ]; then
        print_message "🔄 首次安装依赖..." $YELLOW
        npm install
    else
        print_message "🔄 更新依赖..." $YELLOW
        npm install
    fi
    
    print_message "✅ 依赖安装完成" $GREEN
    cd ..
}

# 初始化数据库
init_database() {
    print_message "🗄️  初始化数据库..." $BLUE
    
    cd client
    
    # 生成 Prisma 客户端
    print_message "🔄 生成 Prisma 客户端..." $YELLOW
    npx prisma generate
    
    # 运行数据库迁移
    print_message "🔄 运行数据库迁移..." $YELLOW
    npx prisma db push
    
    # 可选: 运行种子数据
    if [ -f "prisma/seed.ts" ]; then
        print_message "🌱 运行种子数据..." $YELLOW
        npx prisma db seed
    fi
    
    print_message "✅ 数据库初始化完成" $GREEN
    cd ..
}

# 启动开发服务器
start_dev_server() {
    print_message "🚀 启动开发服务器..." $BLUE
    
    cd client
    
    print_message "🎯 访问地址: http://localhost:3000" $CYAN
    print_message "📊 Prisma Studio: npx prisma studio" $CYAN
    print_message "🛑 按 Ctrl+C 停止服务器" $YELLOW
    echo ""
    
    # 启动 Next.js 开发服务器
    npm run dev
}

# 清理函数
cleanup() {
    print_message "🛑 正在停止服务..." $YELLOW
    
    # 停止 Docker 容器
    if docker ps --format 'table {{.Names}}' | grep -q "homelabs-postgres"; then
        print_message "🐳 停止 PostgreSQL 容器..." $YELLOW
        docker stop homelabs-postgres
    fi
    
    print_message "✅ 清理完成" $GREEN
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    print_header
    
    check_dependencies
    check_ports
    install_dependencies
    init_database
    start_dev_server
}

# 运行主函数
main "$@"
