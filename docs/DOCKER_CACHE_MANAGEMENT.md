# Docker 缓存管理指南

## 📖 概述

本文档介绍如何管理Docker构建缓存，优化磁盘空间使用，同时保持构建速度。

## 🎯 优化效果

### 优化前（使用 `--no-cache`）：
- ❌ 每次构建时间：15-20分钟
- ❌ 每次都下载所有npm依赖（~300MB）
- ❌ 产生大量悬空镜像
- ❌ 磁盘空间快速增长（每次构建+2-3GB）

### 优化后（启用缓存）：
- ✅ 首次构建：15-20分钟
- ✅ 后续构建：2-5分钟（快80%）
- ✅ npm依赖复用缓存（不重复下载）
- ✅ 磁盘占用可控
- ✅ 构建缓存可共享

## 🔧 已实施的优化

### 1. Dockerfile 优化
- 使用 BuildKit 缓存挂载（`--mount=type=cache`）
- 缓存 npm 依赖到 `/root/.npm`
- 缓存 Next.js 构建到 `.next/cache`
- 优化层顺序，减少缓存失效

### 2. GitHub Actions 优化
- 移除 `--no-cache` 参数
- 启用 `DOCKER_BUILDKIT=1`
- 智能清理策略（保留构建缓存）

### 3. 清理脚本
提供四种清理级别：
- **轻度**：仅清理悬空镜像和停止的容器（推荐日常使用）
- **中度**：额外清理未使用的网络和卷（每周执行）
- **深度**：清理7天以上的构建缓存（每月执行）
- **完全**：清理所有缓存（仅紧急情况）

## 📋 使用指南

### 手动清理

#### 1. 日常轻度清理（推荐）

```bash
# 在服务器上执行
cd /path/to/homelabs
chmod +x scripts/docker-cache-cleanup.sh
./scripts/docker-cache-cleanup.sh --light
```

**清理内容**：
- 悬空镜像（`<none>:<none>`）
- 已停止的容器

**适用场景**：
- 每天或每周例行维护
- 磁盘空间充足时
- 需要保持构建速度

#### 2. 中度清理

```bash
./scripts/docker-cache-cleanup.sh --medium
```

**清理内容**：
- 轻度清理的所有内容
- 未使用的网络
- 悬空卷（不是所有未使用的卷）

**适用场景**：
- 每周或每两周执行
- 磁盘使用率 > 60%

#### 3. 深度清理

```bash
./scripts/docker-cache-cleanup.sh --deep
```

**清理内容**：
- 中度清理的所有内容
- 7天以上的构建缓存

**适用场景**：
- 每月执行
- 磁盘使用率 > 80%

#### 4. 完全清理（慎用！）

```bash
./scripts/docker-cache-cleanup.sh --full
```

**清理内容**：
- 所有未使用的镜像
- 所有构建缓存
- 下次构建需要重新下载所有依赖

**适用场景**：
- 磁盘空间严重不足（< 5GB）
- 长期未清理导致空间耗尽
- 需要彻底清理系统

### 模拟运行（安全预览）

在执行任何清理前，可以先模拟运行查看效果：

```bash
./scripts/docker-cache-cleanup.sh --deep --dry-run
```

这会显示将要清理的内容，但不实际删除。

### 查看磁盘使用情况

```bash
# Docker 系统磁盘使用概览
docker system df

# 详细信息
docker system df -v

# 查看镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 查看构建缓存大小
docker buildx du
```

## ⏰ 设置定期自动清理

### 方法1：使用 Crontab（推荐）

```bash
# 编辑 crontab
crontab -e

# 添加以下行：

# 每天凌晨2点执行轻度清理
0 2 * * * /path/to/homelabs/scripts/docker-cache-cleanup.sh --light >> /var/log/docker-cleanup.log 2>&1

# 每周日凌晨3点执行中度清理
0 3 * * 0 /path/to/homelabs/scripts/docker-cache-cleanup.sh --medium >> /var/log/docker-cleanup.log 2>&1

# 每月1号凌晨4点执行深度清理
0 4 1 * * /path/to/homelabs/scripts/docker-cache-cleanup.sh --deep >> /var/log/docker-cleanup.log 2>&1
```

### 方法2：使用 Systemd Timer

创建服务文件：

```bash
sudo nano /etc/systemd/system/docker-cleanup.service
```

内容：

```ini
[Unit]
Description=Docker Cache Cleanup
After=docker.service

[Service]
Type=oneshot
ExecStart=/path/to/homelabs/scripts/docker-cache-cleanup.sh --light
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

创建定时器文件：

```bash
sudo nano /etc/systemd/system/docker-cleanup.timer
```

内容：

```ini
[Unit]
Description=Docker Cache Cleanup Timer
Requires=docker-cleanup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

启用并启动定时器：

```bash
sudo systemctl daemon-reload
sudo systemctl enable docker-cleanup.timer
sudo systemctl start docker-cleanup.timer

# 查看定时器状态
sudo systemctl status docker-cleanup.timer
sudo systemctl list-timers
```

## 🚨 紧急情况处理

### 磁盘空间告急

如果磁盘空间已经不足（< 1GB），按以下顺序操作：

```bash
# 1. 停止所有容器（释放日志空间）
docker stop $(docker ps -aq)

# 2. 清理容器日志
truncate -s 0 /var/lib/docker/containers/*/*-json.log

# 3. 执行完全清理
cd /path/to/homelabs
./scripts/docker-cache-cleanup.sh --full

# 4. 系统级清理
docker system prune -a --volumes -f

# 5. 重启 Docker 服务
sudo systemctl restart docker
```

### Docker 构建卡住或失败

如果构建过程出现问题：

```bash
# 1. 清理构建缓存
docker builder prune -f

# 2. 重新启用 BuildKit
export DOCKER_BUILDKIT=1

# 3. 重新构建
docker compose build
```

## 📊 监控与告警

### 设置磁盘空间监控脚本

创建监控脚本：

```bash
nano ~/monitor-docker-disk.sh
```

内容：

```bash
#!/bin/bash

THRESHOLD=80  # 告警阈值 80%
USAGE=$(df /var/lib/docker | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "⚠️  警告：Docker 磁盘使用率达到 ${USAGE}%"
    echo "建议执行清理：cd /path/to/homelabs && ./scripts/docker-cache-cleanup.sh --medium"
    
    # 可选：发送邮件或其他通知
    # echo "Docker disk usage: ${USAGE}%" | mail -s "Docker Disk Warning" your@email.com
fi
```

添加到 crontab（每小时检查一次）：

```bash
crontab -e

# 添加
0 * * * * ~/monitor-docker-disk.sh >> /var/log/docker-monitor.log 2>&1
```

## 🔍 故障排查

### 问题1：构建速度没有提升

**可能原因**：
- BuildKit 未启用
- 缓存被意外清理
- Dockerfile 层顺序不当

**解决方法**：

```bash
# 检查 BuildKit 是否启用
docker buildx version

# 手动启用 BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 重新构建
docker compose build
```

### 问题2：磁盘空间仍然不足

**可能原因**：
- 容器日志过大
- 数据卷占用空间
- 系统日志过大

**解决方法**：

```bash
# 检查容器日志大小
du -sh /var/lib/docker/containers/*

# 清理大型日志
find /var/lib/docker/containers/ -type f -name "*-json.log" -size +100M -exec truncate -s 0 {} \;

# 检查数据卷大小
docker system df -v | grep -A 20 "Local Volumes"

# 清理未使用的卷（小心！）
docker volume prune -f
```

### 问题3：清理后构建失败

**可能原因**：
- 误删了重要的缓存或镜像
- 基础镜像被清理

**解决方法**：

```bash
# 重新拉取基础镜像
docker pull node:20-alpine
docker pull alpine:3.19

# 重新构建（从头开始）
docker compose build --no-cache
```

## 📚 最佳实践

### 1. 日常维护
- ✅ 每天执行轻度清理
- ✅ 监控磁盘使用率
- ✅ 保持构建缓存

### 2. 定期维护
- ✅ 每周执行中度清理
- ✅ 每月执行深度清理
- ✅ 检查和优化镜像大小

### 3. 开发建议
- ✅ 使用 `.dockerignore` 减少构建上下文
- ✅ 优化 Dockerfile 层顺序
- ✅ 使用多阶段构建
- ✅ 合并相似的 RUN 命令

### 4. 生产环境
- ✅ 定期备份重要数据卷
- ✅ 监控容器日志大小
- ✅ 设置日志轮转策略
- ✅ 使用外部日志收集系统

## 🆘 获取帮助

如果遇到问题：

1. 查看脚本帮助信息：
   ```bash
   ./scripts/docker-cache-cleanup.sh --help
   ```

2. 查看 Docker 官方文档：
   - [BuildKit](https://docs.docker.com/build/buildkit/)
   - [Build cache](https://docs.docker.com/build/cache/)
   - [System prune](https://docs.docker.com/config/pruning/)

3. 查看项目文档：
   - [Docker 部署指南](./DOCKER_ALLINONE_DEPLOYMENT.md)
   - [部署文档](./DEPLOYMENT.md)

