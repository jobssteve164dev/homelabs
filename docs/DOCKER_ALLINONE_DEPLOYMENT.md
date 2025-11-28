# HOMELABS Portal Docker All-in-One 部署文档

## 📋 概述

本文档介绍如何使用 **Docker All-in-One 模式** 部署 HOMELABS Portal。

### All-in-One 模式特点

```
┌─────────────────────────────────────────┐
│           单一 Docker 容器              │
│  ┌─────────────────────────────────┐   │
│  │         Next.js 应用            │   │
│  │         (Port 3000)             │   │
│  └───────────────┬─────────────────┘   │
│                  │ localhost           │
│  ┌───────────────▼─────────────────┐   │
│  │         PostgreSQL              │   │
│  │         (内部 5432)             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📁 /app/logs/                          │
│     ├── postgresql/                     │
│     ├── app/                            │
│     └── combined.log                    │
└─────────────────────────────────────────┘
```

**优点：**
- ✅ 最简配置，只需 1 个容器
- ✅ 数据库使用 localhost 连接，无网络问题
- ✅ 无需配置 Redis、Nginx
- ✅ 统一日志管理

---

## 🚀 快速开始（最小配置）

### 必需的 Secrets（3 个）

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `SERVER_SSH_KEY` | 服务器 SSH 私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `POSTGRES_PASSWORD` | 数据库密码 | `your_strong_password` |
| `NEXTAUTH_SECRET` | 认证密钥（32+ 字符） | `openssl rand -base64 32` |

### 必需的 Variables（3 个）

| Variable 名称 | 说明 | 示例 |
|--------------|------|------|
| `SERVER_HOST` | 服务器 IP 或域名 | `192.168.1.100` |
| `SSH_USER` | SSH 登录用户 | `ubuntu` |
| `NEXTAUTH_URL` | 应用访问地址 | `http://192.168.1.100:3000` |

> ⚠️ **注意**: All-in-One 模式默认不使用 Nginx，需要在 `NEXTAUTH_URL` 中包含端口号！

### 触发部署

修改 `changelog.md` 并推送，或手动触发 GitHub Actions。

---

## 📦 完整变量配置

### 部署架构控制（All-in-One 专用）

| Variable 名称 | 说明 | 默认值 |
|--------------|------|--------|
| `DEPLOY_ARCHITECTURE` | 部署架构 | `all-in-one` |
| `USE_NGINX` | 是否启用 Nginx 反向代理 | `false` |

### 核心配置

| 类型 | 名称 | 说明 | 默认值 |
|------|------|------|--------|
| **Secret** | `POSTGRES_PASSWORD` | 数据库密码 | ⚠️ 必填 |
| **Secret** | `NEXTAUTH_SECRET` | 认证密钥 | ⚠️ 必填 |
| **Variable** | `POSTGRES_DB` | 数据库名称 | `homelabs_portal` |
| **Variable** | `POSTGRES_USER` | 数据库用户 | `homelabs` |
| **Variable** | `APP_PORT` | 应用端口 | `3000` |
| **Variable** | `LOG_LEVEL` | 日志级别 | `info` |

### 服务器配置

| 类型 | 名称 | 说明 | 默认值 |
|------|------|------|--------|
| **Secret** | `SERVER_SSH_KEY` | SSH 私钥 | ⚠️ 必填 |
| **Variable** | `SERVER_HOST` | 服务器地址 | ⚠️ 必填 |
| **Variable** | `SSH_USER` | SSH 用户 | ⚠️ 必填 |
| **Variable** | `SSH_PORT` | SSH 端口 | `22` |
| **Variable** | `DEPLOY_PATH` | 部署目录 | `/opt/homelabs` |

### Nginx 相关（仅当 `USE_NGINX=true`）

| 类型 | 名称 | 说明 | 默认值 |
|------|------|------|--------|
| **Variable** | `NGINX_PORT` | Nginx HTTP 端口 | `80` |
| **Variable** | `NGINX_SSL_PORT` | Nginx HTTPS 端口 | `443` |
| **Variable** | `PRIMARY_DOMAIN` | 主域名 | `localhost` |
| **Variable** | `USE_SSL` | 启用 HTTPS | `false` |
| **Secret** | `SSL_EMAIL` | Let's Encrypt 邮箱 | - |

---

## 🎯 配置示例

### 示例 1: 最简私域部署（推荐）

```
# Secrets
SERVER_SSH_KEY = [你的 SSH 私钥]
POSTGRES_PASSWORD = MySecurePassword123
NEXTAUTH_SECRET = [openssl rand -base64 32 的输出]

# Variables
SERVER_HOST = 192.168.1.100
SSH_USER = ubuntu
NEXTAUTH_URL = http://192.168.1.100:3000
```

访问地址: `http://192.168.1.100:3000`

### 示例 2: 启用 Nginx（需要 80 端口）

```
# 额外添加的 Variables
USE_NGINX = true
NGINX_PORT = 80
NEXTAUTH_URL = http://192.168.1.100  # 不需要端口号
```

访问地址: `http://192.168.1.100`

### 示例 3: 生产环境 + HTTPS

```
# Variables
DEPLOY_ENVIRONMENT = production
USE_NGINX = true
USE_SSL = true
PRIMARY_DOMAIN = portal.example.com
NEXTAUTH_URL = https://portal.example.com

# Secrets
SSL_EMAIL = admin@example.com
```

访问地址: `https://portal.example.com`

---

## 📊 All-in-One vs Multi-Container 对比

| 特性 | All-in-One | Multi-Container |
|------|-----------|-----------------|
| 容器数量 | 1-2 个 | 4 个 |
| 数据库连接 | localhost | Docker 网络 |
| 配置复杂度 | 低 | 高 |
| 资源占用 | 低 | 中 |
| Redis | 不需要 | 需要 |
| 适用场景 | 私域/小型 | 大规模/需扩展 |

### 不再需要的变量（对比 Multi-Container）

以下变量在 All-in-One 模式下**不需要配置**：

| Variable | 原因 |
|----------|------|
| `POSTGRES_HOST_PORT` | 数据库内嵌，不暴露端口 |
| `REDIS_HOST_PORT` | 不使用 Redis |
| `REDIS_URL` | 速率限制使用内存模式 |

---

## 🔧 部署后验证

### 检查容器状态

```bash
cd /opt/homelabs
docker compose ps
```

预期输出（USE_NGINX=false）：
```
NAME            STATUS    PORTS
homelabs-app    Up        0.0.0.0:3000->3000/tcp
```

预期输出（USE_NGINX=true）：
```
NAME             STATUS    PORTS
homelabs-app     Up        3000/tcp
homelabs-nginx   Up        0.0.0.0:80->80/tcp
```

### 查看日志

```bash
# 实时容器输出
docker compose logs -f app

# 组合日志（PostgreSQL + App）
docker compose exec app tail -f /app/logs/combined.log

# PostgreSQL 日志
docker compose exec app tail -f /app/logs/postgresql/postgresql-$(date +%Y-%m-%d).log

# 应用日志
docker compose exec app tail -f /app/logs/app/app-$(date +%Y-%m-%d).log
```

### 检查数据库

```bash
# 进入容器执行 psql
docker compose exec app su-exec postgres psql -d homelabs_portal -c "\dt"
```

---

## ❓ 常见问题

### Q1: 为什么 NEXTAUTH_URL 需要包含端口号？

**A**: 因为默认 `USE_NGINX=false`，应用直接暴露在 `APP_PORT`（默认 3000）。如果你启用了 Nginx，则使用 Nginx 端口（默认 80），不需要端口号。

### Q2: 数据库连接失败怎么办？

**A**: All-in-One 模式下数据库使用 localhost，不会有网络问题。检查日志：
```bash
docker compose exec app tail -50 /app/logs/combined.log | grep -i postgres
```

### Q3: 如何备份数据库？

**A**:
```bash
# 备份
docker compose exec app su-exec postgres pg_dump homelabs_portal > backup.sql

# 恢复
docker compose exec -T app su-exec postgres psql homelabs_portal < backup.sql
```

### Q4: 如何查看 PostgreSQL 慢查询？

**A**: PostgreSQL 已配置记录超过 1 秒的查询：
```bash
docker compose exec app grep "duration:" /app/logs/postgresql/postgresql-$(date +%Y-%m-%d).log
```

---

## 🏥 健康检查说明

All-in-One 模式使用优化的健康检查机制：

### 健康检查参数

| 参数 | 值 | 说明 |
|------|-----|------|
| interval | 30s | 每30秒检查一次 |
| timeout | 30s | 单次检查最多等待30秒 |
| start-period | 180s | 容器启动后前3分钟不计入健康状态 |
| retries | 5 | 连续5次失败才标记为不健康 |

### 启动时间线

```
T+0s:    容器启动
T+120s:  所有服务启动完成
T+180s:  首次健康检查（宽限期结束）
T+240s:  容器标记为健康
```

### 查看健康状态

```bash
# 查看容器健康状态
docker inspect homelabs-allinone | jq '.[0].State.Health'

# 手动测试健康检查端点
curl http://localhost:3000/api/health | jq
```

> 💡 **详细信息**：查看 [健康检查优化文档](./DOCKER_HEALTHCHECK_OPTIMIZATION.md) 了解完整的健康检查机制说明、故障排查和性能基准。

---

## 📚 相关文档

- [健康检查优化文档](./DOCKER_HEALTHCHECK_OPTIMIZATION.md) ⭐ 新增
- [Variables vs Secrets 完整指南](./VARIABLES_VS_SECRETS.md)
- [非 Docker 部署文档](./DEPLOYMENT.md)
- [Docker 故障排除](./DOCKER_DEPLOYMENT_TROUBLESHOOTING.md)

---

**最后更新**: 2025-11-28
**维护者**: AI Assistant

