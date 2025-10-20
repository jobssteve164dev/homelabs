# 🚀 HOMELABS Portal 部署快速开始

这是一份 5 分钟快速部署指南，帮助你将 HOMELABS Portal 部署到你的家庭服务器。

## ⚡ 超快速部署（5 分钟）

### 前提条件

- 一台 Linux 服务器（Ubuntu/Debian/Amazon Linux）
- 可以 SSH 访问服务器
- 本地安装了 `gh` CLI（GitHub 命令行工具）

### 步骤 1: 准备服务器

```bash
# 在你的本地机器执行

# 1. 生成 SSH 密钥
ssh-keygen -t rsa -b 4096 -C "homelabs-deploy" -f ~/.ssh/homelabs_deploy -N ""

# 2. 复制公钥到服务器（替换为你的服务器信息）
ssh-copy-id -i ~/.ssh/homelabs_deploy.pub your_user@your_server_ip

# 3. 测试连接
ssh -i ~/.ssh/homelabs_deploy your_user@your_server_ip "echo '✅ SSH 连接成功'"
```

### 步骤 2: 生成密钥

```bash
# 生成必要的密钥
NEXTAUTH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)

# 保存这些密钥（重要！）
echo "NEXTAUTH_SECRET: $NEXTAUTH_SECRET" > ~/homelabs-secrets.txt
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD" >> ~/homelabs-secrets.txt
echo "✅ 密钥已保存到: ~/homelabs-secrets.txt"
```

### 步骤 3: 配置 GitHub Secrets 和 Variables

```bash
# 确保你在项目目录下
cd /path/to/HOMELABS

# 配置 Secrets（敏感信息）
gh secret set SERVER_SSH_KEY < ~/.ssh/homelabs_deploy
gh secret set POSTGRES_PASSWORD -b "$POSTGRES_PASSWORD"
gh secret set NEXTAUTH_SECRET -b "$NEXTAUTH_SECRET"

# 配置 Variables（非敏感配置）
gh variable set SERVER_HOST -b "your_server_ip"
gh variable set SSH_USER -b "your_username"
gh variable set NEXTAUTH_URL -b "http://your_server_ip"

# 验证配置
echo "✅ 已配置的 Secrets:"
gh secret list
echo ""
echo "✅ 已配置的 Variables:"
gh variable list
```

> 💡 **为什么区分 Secrets 和 Variables？**
> - **Secrets**: 密码、密钥等敏感信息，日志中会被遮蔽为 `***`
> - **Variables**: IP 地址、端口等配置，日志中可见，便于调试
> 
> 详见：[Variables vs Secrets 完整指南](../docs/VARIABLES_VS_SECRETS.md)

### 步骤 4: 触发部署

```bash
# 方式一：使用 GitHub CLI
gh workflow run deploy-local.yml -f deploy_mode=all

# 方式二：通过浏览器
# 1. 打开 https://github.com/your-repo/actions
# 2. 选择"本地环境部署（非Docker）"
# 3. 点击"Run workflow"
# 4. 选择 deploy_mode = "all"
# 5. 点击"Run workflow"

# 查看部署进度
gh run watch
```

### 步骤 5: 访问应用

```bash
# 部署完成后（大约 15-20 分钟）
echo "🎉 部署完成！访问地址:"
echo "   http://your_server_ip"
```

---

## 📋 详细配置（需要自定义配置时）

### 可选配置项

如果需要自定义配置，可以设置以下可选 Variables：

```bash
# 自定义 SSH 端口（默认 22）
gh variable set SSH_PORT -b "2222"

# 自定义部署路径（默认 /opt/homelabs）
gh variable set DEPLOY_PATH -b "/home/user/homelabs"

# 自定义数据库配置
gh variable set POSTGRES_DB -b "my_portal_db"
gh variable set POSTGRES_USER -b "my_db_user"

# 自定义应用端口（默认 3000）
gh variable set APP_PORT -b "3000"

# 自定义 Nginx 端口（默认 80）
gh variable set NGINX_PORT -b "8080"

# 日志级别（默认 info）
gh variable set LOG_LEVEL -b "debug"
```

### 生产环境配置（启用 HTTPS）

如果要部署到生产环境并启用 SSL：

```bash
# 使用 Variables 配置环境类型和域名
gh variable set DEPLOY_ENVIRONMENT -b "production"
gh variable set PRIMARY_DOMAIN -b "homelabs.yourdomain.com"
gh variable set USE_SSL -b "true"
gh variable set ADDITIONAL_DOMAINS -b "www.homelabs.yourdomain.com"

# 使用 Secret 配置 SSL 邮箱（个人信息）
gh secret set SSL_EMAIL -b "admin@yourdomain.com"
```

### 反向代理配置（使用 Lucky 等）

如果服务器位于反向代理后面：

```bash
gh variable set BEHIND_PROXY -b "true"
gh variable set PROXY_REAL_IP_FROM -b "192.168.0.0/16"
gh variable set NGINX_PORT -b "3333"  # 避免与反向代理端口冲突
```

---

## 🔍 部署后检查

### 检查服务状态

SSH 到服务器检查：

```bash
# 连接到服务器
ssh your_user@your_server_ip

# 检查 PM2 状态
pm2 status

# 检查应用日志
pm2 logs homelabs-portal --lines 50

# 检查数据库
sudo systemctl status postgresql

# 检查 Nginx
sudo systemctl status nginx
```

### 测试访问

```bash
# 测试应用是否响应
curl http://localhost:3000

# 测试 Nginx 是否正常代理
curl http://localhost

# 测试数据库连接
psql -U homelabs -d homelabs_portal -c "SELECT version();"
```

---

## 🐛 故障排查

### 问题 1: 部署失败

```bash
# 查看 GitHub Actions 日志
gh run view --log-failed

# 在服务器上查看日志
ssh your_user@your_server_ip
tail -f /opt/homelabs/logs/app-error.log
```

### 问题 2: 应用无法访问

```bash
# 检查端口是否监听
sudo ss -tlnp | grep :3000

# 检查防火墙
sudo ufw status
sudo ufw allow 80/tcp

# 检查 Nginx 配置
sudo nginx -t
```

### 问题 3: 数据库连接失败

```bash
# 检查 PostgreSQL 服务
sudo systemctl status postgresql

# 检查数据库和用户
sudo -u postgres psql -c "\l"  # 列出数据库
sudo -u postgres psql -c "\du"  # 列出用户

# 测试连接
psql -U homelabs -d homelabs_portal -h localhost
```

---

## 🔄 常用操作

### 重新部署

```bash
# 触发新的部署
gh workflow run deploy-local.yml -f deploy_mode=all
```

### 仅更新应用（不重装环境）

```bash
gh workflow run deploy-local.yml -f deploy_mode=app-only
```

### 仅检查环境（不部署）

```bash
gh workflow run deploy-local.yml -f deploy_mode=check
```

### 查看最近的部署记录

```bash
gh run list --workflow=deploy-local.yml --limit 10
```

### 重启应用

```bash
# SSH 到服务器
ssh your_user@your_server_ip

# 重启应用
pm2 restart homelabs-portal

# 重启 Nginx
sudo systemctl restart nginx
```

### 查看日志

```bash
# 实时查看应用日志
pm2 logs homelabs-portal --lines 100

# 查看 Nginx 访问日志
tail -f /opt/homelabs/logs/nginx-access.log

# 查看 Nginx 错误日志
tail -f /opt/homelabs/logs/nginx-error.log
```

---

## 📚 更多资源

- **完整部署文档**: [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
- **GitHub Secrets 配置模板**: [template/github-secrets-template.md](./github-secrets-template.md)
- **项目记忆**: [PROJECT_MEMORY.md](../PROJECT_MEMORY.md)

---

## 💡 提示

### 安全建议

1. **定期更新密钥**: 建议每 90 天更新 `NEXTAUTH_SECRET` 和 `POSTGRES_PASSWORD`
2. **使用强密码**: 确保所有密码至少 16 字符，包含大小写字母、数字和特殊字符
3. **限制 SSH 访问**: 配置防火墙只允许必要的 IP 访问 SSH
4. **启用 SSL**: 生产环境必须使用 HTTPS
5. **定期备份**: 配置自动数据库备份

### 性能优化

1. **使用 PM2 集群模式**: `pm2 start npm --name homelabs-portal -i max -- start`
2. **启用 Nginx 缓存**: 编辑 Nginx 配置添加缓存设置
3. **优化 PostgreSQL**: 调整 `postgresql.conf` 参数
4. **使用 CDN**: 将静态资源托管到 CDN

### 监控和维护

1. **设置监控**: 使用 PM2 Plus 或其他 APM 工具
2. **日志轮转**: 配置日志自动清理，避免磁盘占满
3. **定期更新**: 定期更新依赖包和系统软件
4. **健康检查**: 设置定时任务检查服务健康状态

---

## ❓ 获取帮助

遇到问题？

1. 查看 [常见问题](../docs/DEPLOYMENT.md#-常见问题)
2. 查看 [GitHub Issues](https://github.com/your-repo/issues)
3. 查看部署日志: `gh run view --log-failed`

---

**祝你部署顺利！** 🎉

如果部署成功，别忘了：
- ⭐ 给项目点个 Star
- 📝 分享你的部署经验
- 🐛 报告发现的问题

