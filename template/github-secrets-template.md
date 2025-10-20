# GitHub Secrets 配置模板

## 📋 配置检查清单

复制此清单，逐项配置 GitHub Secrets：

```
必需配置（部署前必须完成）：
□ SERVER_SSH_KEY - 服务器 SSH 私钥
□ SERVER_HOST - 服务器 IP 或域名
□ SSH_USER - SSH 登录用户名
□ POSTGRES_PASSWORD - PostgreSQL 密码
□ NEXTAUTH_SECRET - NextAuth.js 密钥
□ NEXTAUTH_URL - 应用访问 URL

可选配置（使用默认值）：
□ SSH_PORT - SSH 端口（默认: 22）
□ DEPLOY_PATH - 部署路径（默认: /opt/homelabs）
□ POSTGRES_DB - 数据库名（默认: homelabs_portal）
□ POSTGRES_USER - 数据库用户（默认: homelabs）
□ APP_PORT - 应用端口（默认: 3000）
□ NGINX_PORT - Nginx 端口（默认: 80）
□ LOG_LEVEL - 日志级别（默认: info）

生产环境配置（启用 SSL 时）：
□ DEPLOY_ENVIRONMENT=production
□ PRIMARY_DOMAIN - 主域名
□ ADDITIONAL_DOMAINS - 额外域名（可选）
□ USE_SSL=true
□ SSL_EMAIL - Let's Encrypt 邮箱

反向代理配置（使用 Lucky 等时）：
□ BEHIND_PROXY=true
□ PROXY_REAL_IP_FROM - 代理 IP 段（默认: 192.168.0.0/16）
```

## 🔑 密钥生成指南

### 1. 生成 SSH 密钥对

```bash
# 在本地机器执行
ssh-keygen -t rsa -b 4096 -C "github-actions@homelabs" -f ~/.ssh/homelabs_deploy

# 将公钥复制到服务器
ssh-copy-id -i ~/.ssh/homelabs_deploy.pub your_user@your_server

# 查看私钥内容（用于 SERVER_SSH_KEY）
cat ~/.ssh/homelabs_deploy
```

**复制完整的私钥内容**，包括：
```
-----BEGIN OPENSSH PRIVATE KEY-----
...（完整内容）...
-----END OPENSSH PRIVATE KEY-----
```

### 2. 生成 NEXTAUTH_SECRET

```bash
# 方法一：使用 openssl
openssl rand -base64 32

# 方法二：使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法三：使用在线工具
# 访问: https://generate-secret.vercel.app/32
```

**要求**：至少 32 字符的随机字符串

### 3. 设置 PostgreSQL 密码

```bash
# 生成强密码
openssl rand -base64 24
```

**安全建议**：
- 至少 16 字符
- 包含大小写字母、数字和特殊字符
- 不要使用常见密码

## 📝 配置示例

### 本地开发环境配置

```yaml
# 必需 Secrets
SERVER_SSH_KEY: |
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
  ...（完整私钥内容）...
  -----END OPENSSH PRIVATE KEY-----

SERVER_HOST: "192.168.1.100"

SSH_USER: "ubuntu"

POSTGRES_PASSWORD: "MySecurePassword123!@#"

NEXTAUTH_SECRET: "abcdef1234567890abcdef1234567890abcdef12"

NEXTAUTH_URL: "http://192.168.1.100"

# 可选 Secrets（使用默认值可不配置）
SSH_PORT: "22"
DEPLOY_PATH: "/opt/homelabs"
POSTGRES_DB: "homelabs_portal"
POSTGRES_USER: "homelabs"
APP_PORT: "3000"
NGINX_PORT: "80"
APP_URL: "http://192.168.1.100"
```

### 生产环境配置

```yaml
# 必需 Secrets（同上）
SERVER_SSH_KEY: "..."
SERVER_HOST: "your-server.com"
SSH_USER: "ubuntu"
POSTGRES_PASSWORD: "..."
NEXTAUTH_SECRET: "..."
NEXTAUTH_URL: "https://homelabs.your-domain.com"

# 生产环境特定配置
DEPLOY_ENVIRONMENT: "production"
PRIMARY_DOMAIN: "homelabs.your-domain.com"
USE_SSL: "true"
SSL_EMAIL: "admin@your-domain.com"
NGINX_PORT: "80"  # Nginx 会自动处理 SSL 重定向
```

### 内网穿透/反向代理配置

如果使用 Lucky 等反向代理：

```yaml
# 基础配置（同上）
SERVER_SSH_KEY: "..."
SERVER_HOST: "192.168.1.100"
SSH_USER: "ubuntu"
POSTGRES_PASSWORD: "..."
NEXTAUTH_SECRET: "..."
NEXTAUTH_URL: "http://192.168.1.100"

# 反向代理特定配置
BEHIND_PROXY: "true"
PROXY_REAL_IP_FROM: "192.168.0.0/16"  # 反向代理服务器 IP 段
NGINX_PORT: "3333"  # Nginx 监听端口（避免与反向代理冲突）

# 可选：如果有多个域名
ADDITIONAL_DOMAINS: "homelabs2.example.com homelabs3.example.com"
```

## 🛠️ 配置步骤

### 步骤 1: 准备 SSH 密钥

```bash
# 1. 生成密钥对
ssh-keygen -t rsa -b 4096 -f ~/.ssh/homelabs_deploy

# 2. 复制公钥到服务器
ssh-copy-id -i ~/.ssh/homelabs_deploy.pub user@server

# 3. 测试连接
ssh -i ~/.ssh/homelabs_deploy user@server "echo 'SSH 连接成功'"

# 4. 复制私钥内容
cat ~/.ssh/homelabs_deploy | pbcopy  # macOS
cat ~/.ssh/homelabs_deploy | xclip -selection clipboard  # Linux
```

### 步骤 2: 配置 GitHub Secrets

1. 打开 GitHub 仓库
2. 进入 `Settings` > `Secrets and variables` > `Actions`
3. 点击 `New repository secret`
4. 按照上面的示例，逐个添加 Secrets

### 步骤 3: 验证配置

创建一个测试工作流来验证配置：

```bash
# 触发部署前，先运行检查模式
# 在 GitHub Actions 中选择 deploy_mode = "check"
```

## ⚠️ 安全注意事项

### 1. SSH 密钥安全

- ✅ **推荐**: 使用专用密钥，不要使用个人 SSH 密钥
- ✅ **推荐**: 在服务器上配置 `authorized_keys` 限制来源 IP
- ❌ **禁止**: 将私钥提交到代码仓库
- ❌ **禁止**: 在多个项目间共享密钥

### 2. 密码强度要求

所有密码必须满足：
- 长度 ≥ 16 字符
- 包含大小写字母
- 包含数字
- 包含特殊字符 (`!@#$%^&*`)

### 3. Secrets 管理

- 定期轮换密钥（建议 90 天）
- 记录密钥更新日期
- 使用密码管理器存储备份
- 限制团队成员访问权限

### 4. 环境隔离

- 生产环境和开发环境使用不同的密钥
- 不同项目使用独立的数据库账户
- 定期审计 Secrets 使用情况

## 🔍 故障排查

### 问题 1: SSH 连接失败

**症状**: `Permission denied (publickey)`

**解决方案**:
```bash
# 1. 确认公钥已添加到服务器
ssh user@server "cat ~/.ssh/authorized_keys"

# 2. 检查私钥格式
cat ~/.ssh/homelabs_deploy | head -1
# 应该看到: -----BEGIN OPENSSH PRIVATE KEY-----

# 3. 测试连接
ssh -vvv -i ~/.ssh/homelabs_deploy user@server
```

### 问题 2: NEXTAUTH_SECRET 无效

**症状**: NextAuth 报错 `Invalid secret`

**解决方案**:
```bash
# 重新生成密钥
openssl rand -base64 32

# 确保长度 ≥ 32 字符
# 确保没有换行符
```

### 问题 3: 数据库连接失败

**症状**: `ECONNREFUSED` 或 `Authentication failed`

**解决方案**:
```bash
# 在服务器上测试连接
psql -U homelabs -d homelabs_portal -h localhost

# 检查 pg_hba.conf 配置
sudo nano /etc/postgresql/*/main/pg_hba.conf
# 确保有: local   all   all   md5

# 重启 PostgreSQL
sudo systemctl restart postgresql
```

## 📋 配置检查脚本

创建一个本地脚本来验证配置：

```bash
#!/bin/bash
# check-secrets.sh

echo "🔍 检查 GitHub Secrets 配置..."
echo ""

# 检查必需的环境变量
REQUIRED=(
  "SERVER_SSH_KEY"
  "SERVER_HOST"
  "SSH_USER"
  "POSTGRES_PASSWORD"
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
)

for var in "${REQUIRED[@]}"; do
  if gh secret list | grep -q "$var"; then
    echo "✅ $var 已配置"
  else
    echo "❌ $var 未配置"
  fi
done

echo ""
echo "使用方法:"
echo "  1. 安装 GitHub CLI: brew install gh"
echo "  2. 登录: gh auth login"
echo "  3. 运行此脚本: ./check-secrets.sh"
```

## 🎯 快速开始

最小配置（5 分钟内完成）：

```bash
# 1. 生成 SSH 密钥
ssh-keygen -t rsa -b 4096 -f ~/.ssh/homelabs_deploy -N ""
ssh-copy-id -i ~/.ssh/homelabs_deploy.pub user@your-server

# 2. 生成密钥
NEXTAUTH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)

# 3. 配置 GitHub Secrets（使用 gh CLI）
gh secret set SERVER_SSH_KEY < ~/.ssh/homelabs_deploy
gh secret set SERVER_HOST -b "your-server-ip"
gh secret set SSH_USER -b "your-username"
gh secret set POSTGRES_PASSWORD -b "$POSTGRES_PASSWORD"
gh secret set NEXTAUTH_SECRET -b "$NEXTAUTH_SECRET"
gh secret set NEXTAUTH_URL -b "http://your-server-ip"

# 4. 验证配置
gh secret list

echo "✅ 配置完成！现在可以触发部署了。"
```

---

**注意**: 请妥善保管此文档，因为它包含了敏感信息的配置方法。不要将此文档提交到公开仓库。

