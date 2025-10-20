#!/bin/bash

echo "=========================================="
echo "检查.env文件状态"
echo "=========================================="

echo ""
echo "1️⃣  检查client目录下的.env文件:"
if [ -f /opt/homelabs/client/.env ]; then
    echo "✅ 文件存在: /opt/homelabs/client/.env"
    echo ""
    echo "文件内容:"
    cat /opt/homelabs/client/.env
    echo ""
    echo "文件权限:"
    ls -l /opt/homelabs/client/.env
else
    echo "❌ 文件不存在: /opt/homelabs/client/.env"
fi

echo ""
echo "2️⃣  检查根目录下的.env文件:"
if [ -f /opt/homelabs/.env ]; then
    echo "✅ 文件存在: /opt/homelabs/.env"
    echo ""
    echo "文件内容:"
    cat /opt/homelabs/.env
else
    echo "❌ 文件不存在: /opt/homelabs/.env"
fi

echo ""
echo "3️⃣  检查当前工作目录:"
cd /opt/homelabs/client
echo "当前目录: $(pwd)"
echo ""
echo "目录下的.env文件:"
ls -la | grep -E '^\.|env'

echo ""
echo "=========================================="
