# HOMELABS Portal 部署文档

## 概述

本文档详细说明如何在ESXi虚拟机中部署科幻未来风私域AI工具门户网站。

## 系统要求

### 最低配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **网络**: 1个网络接口

### 推荐配置
- **CPU**: 4核心
- **内存**: 8GB RAM
- **存储**: 50GB 可用空间
- **网络**: 1个网络接口

## 部署方式

### 方式一: Docker Compose 部署 (推荐)

#### 1. 准备ESXi虚拟机

```bash
# 创建虚拟机
# 操作系统: Ubuntu 22.04 LTS
# 分配资源: 4核8G内存50G存储
# 网络: 桥接模式
```

#### 2. 安装Docker和Docker Compose

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

#### 3. 部署应用

```bash
# 克隆项目
git clone <repository-url>
cd HOMELABS

# 配置环境变量
cp client/.env.example client/.env.local
# 编辑环境变量文件，设置数据库密码等

# 启动服务
cd docker
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 4. 访问应用

- **应用地址**: http://your-vm-ip:3000
- **数据库管理**: 使用pgAdmin或DBeaver连接PostgreSQL
- **日志查看**: `docker-compose logs -f app`

### 方式二: 手动部署

#### 1. 安装Node.js和PostgreSQL

```bash
# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 创建数据库
sudo -u postgres createdb homelabs_portal
sudo -u postgres createuser --interactive
```

#### 2. 部署应用

```bash
# 进入项目目录
cd client

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑.env.local文件

# 初始化数据库
npx prisma generate
npx prisma db push

# 构建应用
npm run build

# 启动生产服务器
npm start
```

## 配置说明

### 环境变量

```bash
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/homelabs_portal"

# NextAuth.js 配置
NEXTAUTH_URL="http://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"

# 应用配置
NODE_ENV="production"
PORT=3000
```

### 数据库配置

```sql
-- 创建数据库
CREATE DATABASE homelabs_portal;

-- 创建用户
CREATE USER homelabs_user WITH PASSWORD 'your_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE homelabs_portal TO homelabs_user;
```

## 安全配置

### 1. 防火墙设置

```bash
# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # 应用端口 (仅内网访问)

# 启用防火墙
sudo ufw enable
```

### 2. SSL证书配置

```bash
# 使用Let's Encrypt获取免费SSL证书
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 数据库安全

```bash
# 修改PostgreSQL配置
sudo nano /etc/postgresql/14/main/postgresql.conf

# 设置监听地址
listen_addresses = 'localhost'

# 修改认证配置
sudo nano /etc/postgresql/14/main/pg_hba.conf

# 设置本地连接认证
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

## 监控和维护

### 1. 日志管理

```bash
# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f postgres

# 日志轮转配置
sudo nano /etc/logrotate.d/homelabs
```

### 2. 备份策略

```bash
# 数据库备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec homelabs-postgres pg_dump -U postgres homelabs_portal > backup_$DATE.sql

# 定期备份 (添加到crontab)
0 2 * * * /path/to/backup_script.sh
```

### 3. 性能监控

```bash
# 安装监控工具
sudo apt install htop iotop nethogs -y

# 监控系统资源
htop
iotop
nethogs
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   sudo netstat -tlnp | grep :3000
   
   # 杀死占用进程
   sudo kill -9 <PID>
   ```

2. **数据库连接失败**
   ```bash
   # 检查PostgreSQL状态
   sudo systemctl status postgresql
   
   # 重启PostgreSQL
   sudo systemctl restart postgresql
   ```

3. **内存不足**
   ```bash
   # 检查内存使用
   free -h
   
   # 清理Docker缓存
   docker system prune -a
   ```

### 日志分析

```bash
# 查看错误日志
docker-compose logs app | grep ERROR

# 查看访问日志
docker-compose logs nginx | grep "GET\|POST"

# 实时监控日志
docker-compose logs -f --tail=100 app
```

## 更新和维护

### 应用更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 运行数据库迁移
docker-compose exec app npx prisma db push
```

### 系统维护

```bash
# 定期更新系统
sudo apt update && sudo apt upgrade -y

# 清理Docker资源
docker system prune -a

# 重启服务
docker-compose restart
```

## 联系支持

如果在部署过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查应用日志和系统日志
3. 联系技术支持团队

---

**注意**: 请确保在生产环境中使用强密码和安全的配置设置。
