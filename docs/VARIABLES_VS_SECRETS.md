# GitHub Actions Variables vs Secrets 分类指南

## 📊 快速对照表

| 变量名 | 推荐位置 | 原因 | 示例值 |
|--------|---------|------|--------|
| `SERVER_SSH_KEY` | 🔒 **Secrets** | SSH 私钥，高度敏感 | `-----BEGIN OPENSSH...` |
| `POSTGRES_PASSWORD` | 🔒 **Secrets** | 数据库密码，敏感 | `8h5WIpYDnVpA6JwiAs139AC7QTr7Jb6Z` |
| `NEXTAUTH_SECRET` | 🔒 **Secrets** | 认证密钥，敏感 | `KSzrdve42s2sTstWypeEMYBqoEdsjKcZYRr9XI4KQhA=` |
| `SSL_EMAIL` | 🔒 **Secrets** | 邮箱，个人信息 | `1980296464@qq.com` |
| `SERVER_HOST` | 📝 **Variables** | 服务器地址，非敏感 | `ssh.szlk.edu.eu.org` |
| `SSH_USER` | 📝 **Variables** | SSH 用户名，非敏感 | `szlk` |
| `SSH_PORT` | 📝 **Variables** | SSH 端口，非敏感 | `22223` |
| `DEPLOY_PATH` | 📝 **Variables** | 部署路径，非敏感 | `/opt/homelabs` |
| `POSTGRES_DB` | 📝 **Variables** | 数据库名，非敏感 | `homelabs_portal` |
| `POSTGRES_USER` | 📝 **Variables** | 数据库用户，非敏感 | `homelabs` |
| `APP_PORT` | 📝 **Variables** | 应用端口，非敏感 | `3001` |
| `NGINX_PORT` | 📝 **Variables** | Nginx 端口，非敏感 | `3333` |
| `NEXTAUTH_URL` | 📝 **Variables** | 应用 URL，非敏感 | `https://aiuni.szlk.site` |
| `APP_URL` | 📝 **Variables** | 应用 URL，非敏感 | `https://aiuni.szlk.site` |
| `LOG_LEVEL` | 📝 **Variables** | 日志级别，非敏感 | `info` |
| `DEPLOY_ENVIRONMENT` | 📝 **Variables** | 环境类型，非敏感 | `local` |
| `PRIMARY_DOMAIN` | 📝 **Variables** | 主域名，非敏感 | `aiuni.szlk.site` |
| `ADDITIONAL_DOMAINS` | 📝 **Variables** | 额外域名，非敏感 | `aiuni.site` |
| `USE_SSL` | 📝 **Variables** | SSL 开关，非敏感 | `false` |
| `BEHIND_PROXY` | 📝 **Variables** | 代理开关，非敏感 | `false` |
| `PROXY_REAL_IP_FROM` | 📝 **Variables** | 代理 IP 段，非敏感 | `192.168.2.0/24` |

## 🎯 分类统计

- **Secrets（敏感）**: 4 个
- **Variables（非敏感）**: 17 个
- **总计**: 21 个

## 💡 `NEXTAUTH_URL` vs `APP_URL` 详解

这两个变量经常让人困惑，让我们详细对比一下：

| 特性 | `NEXTAUTH_URL` | `APP_URL` |
|------|---------------|-----------|
| **是否必需** | ✅ **必需** | ❌ 可选 |
| **来源** | NextAuth.js 官方要求 | 应用自定义变量 |
| **主要用途** | • OAuth 回调 URL<br>• 会话验证<br>• CORS 配置 | • 邮件通知链接<br>• 分享链接生成<br>• API 基础 URL |
| **谁在使用** | NextAuth.js 库内部 | 应用代码（如果需要） |
| **典型值** | `https://aiuni.szlk.site` | `https://aiuni.szlk.site` |
| **不配置会怎样** | ❌ NextAuth 无法工作 | ✅ 可以在代码中使用 `NEXTAUTH_URL` 代替 |

### 📝 配置建议

**方案一：只配置 `NEXTAUTH_URL`（推荐）**
```bash
gh variable set NEXTAUTH_URL -b "https://aiuni.szlk.site"
# APP_URL 不配置，应用代码中需要时使用 process.env.NEXTAUTH_URL
```

**方案二：两者都配置相同值**
```bash
gh variable set NEXTAUTH_URL -b "https://aiuni.szlk.site"
gh variable set APP_URL -b "https://aiuni.szlk.site"
# 语义更清晰，但配置略繁琐
```

### 🤔 什么时候它们的值可能不同？

极少数边缘场景：
- **内网 + 公网双域名**: 
  - `NEXTAUTH_URL` = `http://192.168.1.100`（内网认证）
  - `APP_URL` = `https://aiuni.szlk.site`（公网分享链接）
  
- **多域名环境**: 
  - `NEXTAUTH_URL` = `https://auth.example.com`（认证专用域名）
  - `APP_URL` = `https://app.example.com`（应用主域名）

**对于大多数用户**: 两者保持相同即可！

## 📋 详细说明

### 🔒 必须放在 Secrets 中的（4个）

这些变量包含敏感信息，必须使用 Secrets 存储：

1. **SERVER_SSH_KEY**
   - 类型: SSH 私钥
   - 敏感性: ⚠️ 高度敏感
   - 原因: 泄露后可直接访问服务器
   - 配置: `Settings → Secrets and variables → Actions → New repository secret`

2. **POSTGRES_PASSWORD**
   - 类型: 数据库密码
   - 敏感性: ⚠️ 敏感
   - 原因: 泄露后可访问数据库
   - 配置: `Settings → Secrets and variables → Actions → New repository secret`

3. **NEXTAUTH_SECRET**
   - 类型: JWT 签名密钥
   - 敏感性: ⚠️ 敏感
   - 原因: 泄露后可伪造用户会话
   - 配置: `Settings → Secrets and variables → Actions → New repository secret`

4. **SSL_EMAIL**
   - 类型: 邮箱地址
   - 敏感性: ⚠️ 轻度敏感（个人信息）
   - 原因: 包含个人联系方式
   - 配置: `Settings → Secrets and variables → Actions → New repository secret`

### 📝 推荐放在 Variables 中的（17个）

这些是非敏感的配置信息，使用 Variables 的好处：
- ✅ 在工作流日志中可见，便于调试
- ✅ 可以在不同环境间共享（通过 Environment）
- ✅ 更改后无需重新输入（Secrets 无法查看）

#### 服务器连接配置（4个）

5. **SERVER_HOST**
   - 说明: 服务器 IP 或域名
   - 示例: `192.168.1.100`
   - 配置: `Settings → Secrets and variables → Actions → Variables tab → New repository variable`

6. **SSH_USER**
   - 说明: SSH 登录用户名
   - 示例: `ubuntu`
   - 默认值: 无
   - 配置: 同上

7. **SSH_PORT**
   - 说明: SSH 端口
   - 示例: `22`
   - 默认值: `22`
   - 配置: 同上（可选）

8. **DEPLOY_PATH**
   - 说明: 应用部署路径
   - 示例: `/opt/homelabs`
   - 默认值: `/opt/homelabs`
   - 配置: 同上（可选）

#### 数据库配置（2个）

9. **POSTGRES_DB**
   - 说明: 数据库名称
   - 示例: `homelabs_portal`
   - 默认值: `homelabs_portal`
   - 配置: 同上（可选）

10. **POSTGRES_USER**
    - 说明: 数据库用户名
    - 示例: `homelabs`
    - 默认值: `homelabs`
    - 配置: 同上（可选）

#### 应用配置（5个）

11. **APP_PORT**
    - 说明: Next.js 应用监听端口
    - 示例: `3000`
    - 默认值: `3000`
    - 配置: 同上（可选）

12. **NEXTAUTH_URL** ⚠️ 必需
    - 说明: NextAuth.js 官方环境变量，用于认证回调和会话验证
    - 用途: OAuth 回调 URL、会话验证、CORS 配置
    - 示例: `https://aiuni.szlk.site`
    - 默认值: 无
    - 配置: 同上

13. **APP_URL** (可选)
    - 说明: 应用自定义 URL，用于非认证场景（如邮件链接、分享链接等）
    - 用途: 应用内部生成绝对 URL、邮件通知、API 调用基础 URL
    - 示例: `https://aiuni.szlk.site`
    - 默认值: 如不配置，应用代码中可以使用 `NEXTAUTH_URL` 代替
    - 配置: 同上（可选）
    - 💡 **建议**: 大多数情况下可以不配置，直接使用 `NEXTAUTH_URL`

14. **LOG_LEVEL**
    - 说明: 应用日志级别
    - 示例: `info` / `debug` / `warn` / `error`
    - 默认值: `info`
    - 配置: 同上（可选）

15. **NGINX_PORT**
    - 说明: Nginx 监听端口
    - 示例: `80` / `3333`（反向代理）
    - 默认值: `80`
    - 配置: 同上（可选）

#### 生产环境配置（4个）

16. **DEPLOY_ENVIRONMENT**
    - 说明: 部署环境类型
    - 示例: `local` / `production`
    - 默认值: `local`
    - 配置: 同上（可选）

17. **PRIMARY_DOMAIN**
    - 说明: 主域名
    - 示例: `homelabs.example.com`
    - 默认值: `localhost`
    - 配置: 同上（可选）

18. **ADDITIONAL_DOMAINS**
    - 说明: 额外的域名（空格分隔）
    - 示例: `api.homelabs.com admin.homelabs.com`
    - 默认值: 空
    - 配置: 同上（可选）

19. **USE_SSL**
    - 说明: 是否启用 SSL/HTTPS
    - 示例: `true` / `false`
    - 默认值: `false`
    - 配置: 同上（可选）

#### 反向代理配置（2个）

20. **BEHIND_PROXY**
    - 说明: 是否在反向代理后面
    - 示例: `true` / `false`
    - 默认值: `false`
    - 配置: 同上（可选）

21. **PROXY_REAL_IP_FROM**
    - 说明: 反向代理服务器的 IP 段
    - 示例: `192.168.0.0/16`
    - 默认值: `192.168.0.0/16`
    - 配置: 同上（可选）

## 🚀 配置步骤

### 方式一：GitHub Web UI

#### 配置 Secrets（敏感信息）

1. 访问仓库 `Settings → Secrets and variables → Actions`
2. 点击 `New repository secret`
3. 添加以下 4 个 Secrets：
   - `SERVER_SSH_KEY`
   - `POSTGRES_PASSWORD`
   - `NEXTAUTH_SECRET`
   - `SSL_EMAIL`（可选）

#### 配置 Variables（非敏感配置）

1. 在同一页面，点击 `Variables` 标签页
2. 点击 `New repository variable`
3. 添加至少以下必需的 Variables：
   - `SERVER_HOST`
   - `SSH_USER`
   - `NEXTAUTH_URL`

4. 可选添加其他 Variables（使用默认值则无需添加）

### 方式二：GitHub CLI

```bash
# 配置 Secrets（敏感信息）
gh secret set SERVER_SSH_KEY < ~/.ssh/homelabs_deploy
gh secret set POSTGRES_PASSWORD -b "$(openssl rand -base64 24)"
gh secret set NEXTAUTH_SECRET -b "$(openssl rand -base64 32)"
gh secret set SSL_EMAIL -b "admin@example.com"

# 配置 Variables（非敏感配置）
gh variable set SERVER_HOST -b "192.168.1.100"
gh variable set SSH_USER -b "ubuntu"
gh variable set NEXTAUTH_URL -b "http://192.168.1.100"

# 可选：更多 Variables
gh variable set SSH_PORT -b "22"
gh variable set DEPLOY_PATH -b "/opt/homelabs"
gh variable set APP_PORT -b "3000"
gh variable set LOG_LEVEL -b "info"
```

## 📖 使用场景示例

### 场景一：本地开发环境（最小配置）

**Secrets (4个)**:
```bash
gh secret set SERVER_SSH_KEY < ~/.ssh/homelabs_deploy
gh secret set POSTGRES_PASSWORD -b "dev_password_123"
gh secret set NEXTAUTH_SECRET -b "$(openssl rand -base64 32)"
```

**Variables (3个)**:
```bash
gh variable set SERVER_HOST -b "192.168.1.100"
gh variable set SSH_USER -b "ubuntu"
gh variable set NEXTAUTH_URL -b "http://192.168.1.100"
```

**结果**: 其他配置使用默认值

---

### 场景二：生产环境 + SSL

**Secrets (4个)**:
```bash
gh secret set SERVER_SSH_KEY < ~/.ssh/homelabs_production
gh secret set POSTGRES_PASSWORD -b "$(openssl rand -base64 32)"
gh secret set NEXTAUTH_SECRET -b "$(openssl rand -base64 32)"
gh secret set SSL_EMAIL -b "admin@example.com"
```

**Variables (6个)**:
```bash
gh variable set SERVER_HOST -b "homelabs.example.com"
gh variable set SSH_USER -b "deploy"
gh variable set NEXTAUTH_URL -b "https://homelabs.example.com"
gh variable set DEPLOY_ENVIRONMENT -b "production"
gh variable set PRIMARY_DOMAIN -b "homelabs.example.com"
gh variable set USE_SSL -b "true"
```

---

### 场景三：内网 + Lucky 反向代理

**Secrets (3个)**:
```bash
gh secret set SERVER_SSH_KEY < ~/.ssh/homelabs_deploy
gh secret set POSTGRES_PASSWORD -b "password_123"
gh secret set NEXTAUTH_SECRET -b "$(openssl rand -base64 32)"
```

**Variables (6个)**:
```bash
gh variable set SERVER_HOST -b "192.168.1.100"
gh variable set SSH_USER -b "ubuntu"
gh variable set NEXTAUTH_URL -b "http://192.168.1.100"
gh variable set NGINX_PORT -b "3333"
gh variable set BEHIND_PROXY -b "true"
gh variable set PROXY_REAL_IP_FROM -b "192.168.0.0/16"
```

## 🔍 Variables vs Secrets 的区别

| 特性 | Variables | Secrets |
|------|-----------|---------|
| **用途** | 非敏感配置 | 敏感信息 |
| **可见性** | 日志中可见 | 日志中遮蔽为 `***` |
| **可编辑** | 可查看和编辑 | 只能覆盖，无法查看 |
| **Environment 支持** | ✅ 支持环境级别 | ✅ 支持环境级别 |
| **引用方式** | `${{ vars.NAME }}` | `${{ secrets.NAME }}` |
| **适用场景** | 端口、路径、URL | 密码、密钥、令牌 |
| **最佳实践** | 默认使用 Variables | 仅用于敏感数据 |

## ⚠️ 安全建议

### 1. 最小权限原则

只将真正敏感的信息放入 Secrets：
- ✅ 密码、密钥、令牌
- ❌ 端口号、路径、用户名

### 2. 定期轮换密钥

建议每 90 天更新一次 Secrets：
```bash
# 重新生成并更新
gh secret set NEXTAUTH_SECRET -b "$(openssl rand -base64 32)"
gh secret set POSTGRES_PASSWORD -b "$(openssl rand -base64 32)"
```

### 3. 使用 Environment

对于多环境部署，使用 GitHub Environments：
- `development`: 开发环境变量
- `staging`: 预发布环境变量
- `production`: 生产环境变量（需要审批）

### 4. 审计日志

定期检查 Actions 日志，确保没有敏感信息泄露：
- Secrets 会自动被遮蔽为 `***`
- Variables 在日志中可见，确保不包含敏感信息

## 📚 参考资料

- [GitHub Actions - Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions - Variables](https://docs.github.com/en/actions/learn-github-actions/variables)
- [GitHub CLI - Secret Management](https://cli.github.com/manual/gh_secret)
- [GitHub CLI - Variable Management](https://cli.github.com/manual/gh_variable)

## 🎉 总结

| 配置类型 | 数量 | 配置方式 | 原因 |
|---------|------|---------|------|
| **Secrets** | 4 个 | `gh secret set` | 包含密码、密钥等敏感信息 |
| **Variables** | 17 个 | `gh variable set` | 非敏感配置，便于调试和管理 |

**核心原则**: 
- 🔒 **敏感的用 Secrets**（密码、密钥）
- 📝 **其他用 Variables**（配置、地址、端口）
- ✅ **工作流已支持两者**，优先使用 Variables，回退到 Secrets

