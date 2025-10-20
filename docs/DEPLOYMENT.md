# HOMELABS Portal 本地部署文档

## 📋 概述

本文档介绍如何使用 GitHub Actions 将 HOMELABS Portal 部署到你的家庭服务器（非 Docker 模式）。

## 🛠️ 技术栈

- **应用框架**: Next.js 14 (App Router)
- **数据库**: PostgreSQL 15+
- **进程管理**: PM2
- **反向代理**: Nginx
- **运行环境**: Node.js 18+

## 📦 前置要求

### 服务器要求

- **操作系统**: Ubuntu 20.04+ / Debian 11+ / Amazon Linux 2
- **CPU**: 最低 2 核
- **内存**: 最低 4GB RAM
- **磁盘**: 最低 20GB 可用空间
- **网络**: 开放端口 80 (HTTP) 或 443 (HTTPS)

### GitHub 配置要求

> 💡 **Variables vs Secrets 分类说明**
> 
> GitHub Actions 支持两种配置方式：
> - **Secrets** 🔒: 用于存储敏感信息（密码、密钥），日志中会被遮蔽
> - **Variables** 📝: 用于存储非敏感配置（端口、路径、URL），日志中可见，便于调试
> 
> 📖 详细的分类指南和配置示例，请参考：[Variables vs Secrets 完整指南](./VARIABLES_VS_SECRETS.md)

#### 必需的 Secrets（敏感信息）

在 GitHub 仓库的 `Settings > Secrets and variables > Actions > Secrets` 标签页中配置：

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `SERVER_SSH_KEY` | 服务器 SSH 私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `POSTGRES_PASSWORD` | PostgreSQL 数据库密码 | `strong_password_here` |
| `NEXTAUTH_SECRET` | NextAuth.js 密钥 | 至少 32 字符的随机字符串 |
| `SSL_EMAIL` | Let's Encrypt 证书邮箱（可选） | `admin@example.com` |

#### 必需的 Variables（非敏感配置）

在 GitHub 仓库的 `Settings > Secrets and variables > Actions > Variables` 标签页中配置：

| Variable 名称 | 说明 | 示例值 |
|--------------|------|--------|
| `SERVER_HOST` | 服务器 IP 或域名 | `192.168.1.100` |
| `SSH_USER` | SSH 登录用户名 | `ubuntu` |
| `NEXTAUTH_URL` | NextAuth 认证 URL（应用访问地址） | `http://192.168.1.100` |

#### 可选的 Variables

| Variable 名称 | 说明 | 默认值 |
|--------------|------|--------|
| `SSH_PORT` | SSH 端口 | `22` |
| `DEPLOY_PATH` | 部署目录 | `/opt/homelabs` |
| `POSTGRES_DB` | 数据库名称 | `homelabs_portal` |
| `POSTGRES_USER` | 数据库用户名 | `homelabs` |
| `APP_PORT` | 应用端口 | `3000` |
| `NGINX_PORT` | Nginx 监听端口 | `80` |
| `APP_URL` | 应用自定义 URL（可选，大多数情况使用 `NEXTAUTH_URL` 即可） | 同 `NEXTAUTH_URL` |
| `LOG_LEVEL` | 日志级别 | `info` |

#### 生产环境额外配置（可选）

如果部署到生产环境并需要 SSL：

| Variable/Secret 名称 | 说明 | 默认值 |
|---------------------|------|--------|
| `DEPLOY_ENVIRONMENT` | 设置为 `production` | `local` |
| `PRIMARY_DOMAIN` | 主域名 | `localhost` |
| `ADDITIONAL_DOMAINS` | 额外的域名（空格分隔） | 空 |
| `USE_SSL` | 设置为 `true` 启用 HTTPS | `false` |
| `SSL_EMAIL` | Let's Encrypt 证书申请邮箱 | 空 |

#### 反向代理配置（可选）

如果服务器位于 Lucky 等反向代理后面：

| Variable/Secret 名称 | 说明 | 默认值 |
|---------------------|------|--------|
| `BEHIND_PROXY` | 设置为 `true` 启用真实 IP 检测 | `false` |
| `PROXY_REAL_IP_FROM` | 反向代理服务器的 IP 段 | `192.168.0.0/16` |

## 🚀 部署步骤

### 1. 生成 SSH 密钥（如果还没有）

在本地执行：

```bash
# 生成新的 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "github-actions@homelabs" -f ~/.ssh/homelabs_deploy

# 将公钥复制到服务器
ssh-copy-id -i ~/.ssh/homelabs_deploy.pub user@your-server

# 复制私钥内容（添加到 GitHub Secrets）
cat ~/.ssh/homelabs_deploy
```

### 2. 配置 GitHub Secrets

1. 进入 GitHub 仓库
2. 点击 `Settings` > `Secrets and variables` > `Actions`
3. 点击 `New repository secret`
4. 逐个添加上述必需的 Secrets

### 3. 生成 NEXTAUTH_SECRET

```bash
# 使用 openssl 生成随机密钥
openssl rand -base64 32
```

将输出结果添加到 GitHub Secrets 的 `NEXTAUTH_SECRET`。

### 4. 触发部署

#### 方式一：通过 GitHub 网页界面

1. 进入仓库的 `Actions` 标签页
2. 选择 `本地环境部署（非Docker）` 工作流
3. 点击 `Run workflow`
4. 选择部署模式：
   - `all`: 完整部署（推荐）
   - `app-only`: 仅部署应用
   - `check`: 仅检查环境
5. 点击 `Run workflow` 确认

#### 方式二：通过 Git 推送触发（需配置）

```bash
git push origin main
```

### 5. 监控部署进度

在 `Actions` 标签页查看实时部署日志，整个部署过程大约需要 10-20 分钟。

## 📊 部署后验证

部署完成后，执行以下检查：

### 1. 检查服务状态

SSH 到服务器：

```bash
ssh user@your-server

# 检查 PM2 状态
pm2 status

# 检查应用日志
pm2 logs homelabs-portal

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查 PostgreSQL 状态
sudo systemctl status postgresql
```

### 2. 访问应用

在浏览器中访问：

- **本地环境**: `http://your-server-ip`
- **生产环境**: `https://your-domain.com`

### 3. 检查数据库

```bash
# 连接到数据库
psql -U homelabs -d homelabs_portal

# 查看表
\dt

# 退出
\q
```

## 🔧 常见问题

### Q1: 部署失败，如何查看详细日志？

**A**: 
1. 在 GitHub Actions 页面查看完整的部署日志
2. SSH 到服务器查看应用日志：
   ```bash
   pm2 logs homelabs-portal --lines 100
   tail -f /opt/homelabs/logs/app-error.log
   ```

### Q2: 如何回滚到上一个版本？

**A**: 工作流会自动保留最近 3 个备份，如果部署失败会自动回滚。手动回滚：

```bash
# 查看备份
ls -la /opt/ | grep homelabs_backup

# 停止当前服务
pm2 stop homelabs-portal

# 恢复备份
mv /opt/homelabs /opt/homelabs_broken
mv /opt/homelabs_backup_20250120_123456 /opt/homelabs

# 重启服务
cd /opt/homelabs/client
pm2 start npm --name homelabs-portal -- start
pm2 save
```

### Q3: 如何更新环境变量？

**A**: 
1. 更新 GitHub Secrets
2. 重新触发部署，或手动更新：
   ```bash
   cd /opt/homelabs
   nano .env  # 编辑环境变量
   pm2 restart homelabs-portal
   ```

### Q4: 数据库迁移失败怎么办？

**A**:
```bash
cd /opt/homelabs/client
npx prisma db push --skip-generate  # 强制推送
# 或
npx prisma db push --force-reset    # 重置数据库（危险！）
```

### Q5: Nginx 配置错误怎么办？

**A**:
```bash
# 测试 Nginx 配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 恢复备份配置
sudo cp /etc/nginx/sites-available/homelabs.backup.* /etc/nginx/sites-available/homelabs
sudo systemctl reload nginx
```

## 🔐 安全建议

1. **定期更新密钥**: 每 90 天更新 `NEXTAUTH_SECRET` 和数据库密码
2. **启用 SSL**: 生产环境必须使用 HTTPS
3. **防火墙配置**: 只开放必要的端口（80, 443, SSH）
4. **定期备份**: 配置自动数据库备份
   ```bash
   # 创建备份脚本
   pg_dump -U homelabs homelabs_portal > backup_$(date +%Y%m%d).sql
   ```
5. **监控日志**: 定期检查应用和系统日志

## 📈 性能优化

### 1. 启用数据库连接池

在 `.env` 中配置：

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public&connection_limit=10"
```

### 2. 配置 PM2 集群模式（可选）

```bash
pm2 start npm --name homelabs-portal -i max -- start
```

### 3. 启用 Nginx 缓存（可选）

编辑 `/etc/nginx/sites-available/homelabs`，添加缓存配置。

## 🆘 紧急联系

如果遇到无法解决的问题：

1. 查看 [GitHub Issues](https://github.com/your-repo/issues)
2. 查看项目文档 `PROJECT_MEMORY.md`
3. 联系技术支持

## 📚 相关文档

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Prisma 生产部署](https://www.prisma.io/docs/guides/deployment)
- [PM2 文档](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx 配置指南](https://nginx.org/en/docs/)

---

**最后更新**: 2025-10-20
**维护者**: AI Assistant
