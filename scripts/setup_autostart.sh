#!/bin/bash

# PM2自启动配置脚本
# 用于配置服务器重启后应用自动启动

set -e

echo "🚀 开始配置PM2自启动..."

# 获取当前用户名
USER=$(whoami)
HOME_DIR=$(eval echo ~$USER)

echo "📋 当前用户: $USER"
echo "📋 用户目录: $HOME_DIR"

# 检查PM2是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2未安装，请先安装PM2"
    exit 1
fi

# 检查当前PM2进程
echo "📊 当前PM2进程状态:"
pm2 status

# 配置PM2系统启动脚本
echo "⚙️  配置PM2系统启动脚本..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME_DIR

# 保存当前PM2进程列表
echo "💾 保存当前PM2进程列表..."
pm2 save

echo "✅ PM2自启动配置完成！"
echo ""
echo "📝 配置说明:"
echo "   - PM2已配置为系统服务"
echo "   - 服务器重启后，应用将自动启动"
echo "   - 进程列表已保存到 ~/.pm2/dump.pm2"
echo ""
echo "🔍 验证命令:"
echo "   pm2 status    # 查看进程状态"
echo "   pm2 logs      # 查看应用日志"
echo "   sudo reboot   # 测试重启（可选）"
