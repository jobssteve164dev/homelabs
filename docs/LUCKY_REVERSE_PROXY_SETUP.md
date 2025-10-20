# Lucky 反向代理配置指南

## 🏠 家庭服务器 + Lucky 反向代理架构

### 架构图

```
互联网
  ↓
  📡 https://aiuni.szlk.site (域名)
  ↓
  ┌─────────────────────────────────────┐
  │   Lucky 反向代理服务器               │
  │   监听: 80/443 端口                  │
  │   处理: SSL/TLS 终止                 │
  ├─────────────────────────────────────┤
  │   转发规则:                          │
  │   https://aiuni.szlk.site           │
  │     ↓                                │
  │   http://192.168.2.x:3333 ← 转发到这里
  └─────────────────────────────────────┘
       ↓ (内网)
  ┌─────────────────────────────────────┐
  │   HOMELABS 应用服务器                │
  │   IP: 192.168.2.x                   │
  ├─────────────────────────────────────┤
  │   Nginx (监听 3333 端口)             │← NGINX_PORT=3333
  │     ↓                                │
  │   Next.js (监听 3000 端口)          │← APP_PORT=3000
  └─────────────────────────────────────┘
```

---

## ⚙️ GitHub Variables 配置

### 必需配置

```bash
# 1. 服务器连接信息
gh variable set SERVER_HOST -b "192.168.2.x"        # 应用服务器的内网 IP
gh variable set SSH_USER -b "szlk"
gh variable set SSH_PORT -b "22223"

# 2. 应用 URL（使用公网域名）
gh variable set NEXTAUTH_URL -b "https://aiuni.szlk.site"

# 3. Nginx 端口（避免与 Lucky 冲突）
gh variable set NGINX_PORT -b "3333"                # ⚠️ 关键配置！

# 4. 反向代理配置
gh variable set BEHIND_PROXY -b "true"              # ⚠️ 启用反向代理支持
gh variable set PROXY_REAL_IP_FROM -b "192.168.2.0/24"  # Lucky 服务器的 IP 段

# 5. 应用端口（Next.js）
gh variable set APP_PORT -b "3000"                  # 默认即可
```

### 可选配置

```bash
# 主域名
gh variable set PRIMARY_DOMAIN -b "aiuni.szlk.site"

# 额外域名（如果有）
gh variable set ADDITIONAL_DOMAINS -b "aiuni.site"

# 数据库配置（使用默认值可不配置）
# gh variable set POSTGRES_DB -b "homelabs_portal"
# gh variable set POSTGRES_USER -b "homelabs"
```

---

## 🔑 GitHub Secrets 配置

```bash
# SSH 密钥
gh secret set SERVER_SSH_KEY < ~/.ssh/homelabs_deploy

# 数据库密码
gh secret set POSTGRES_PASSWORD -b "bD3tddNaIQ/tOSuwbTIiwZecKVR21gHh"

# NextAuth 密钥
gh secret set NEXTAUTH_SECRET -b "KSzrdve42s2sTstWypeEMYBqoEdsjKcZYRr9XI4KQhA="

# SSL 邮箱（可选，Lucky 已处理 SSL）
# gh secret set SSL_EMAIL -b "admin@example.com"
```

---

## 🎯 关键配置说明

### 1. `NGINX_PORT` = `3333` ⚠️ 重要！

**为什么不是 443？**
- ❌ `443` 已被 Lucky 占用（处理 HTTPS）
- ✅ `3333` 是内网端口，不与 Lucky 冲突
- ✅ Lucky 会转发流量到 `http://192.168.2.x:3333`

**端口选择建议**:
- `3333` - 推荐（常用）
- `8080` - 备选
- `8888` - 备选
- 任何未被占用的端口（1024-65535）

### 2. `BEHIND_PROXY` = `true` ⚠️ 重要！

**作用**:
- ✅ 让 Nginx 从 `X-Forwarded-For` 头获取真实客户端 IP
- ✅ 避免所有请求显示为来自 Lucky 的 IP
- ✅ 正确记录访问日志

**如果不设置**:
- ❌ 应用看到的所有 IP 都是 Lucky 服务器的 IP
- ❌ 无法做 IP 限流、地理位置判断
- ❌ 日志分析失效

### 3. `PROXY_REAL_IP_FROM` = `192.168.2.0/24`

**说明**:
- 这是 Lucky 服务器所在的 IP 段
- Nginx 只信任来自这个 IP 段的 `X-Forwarded-For` 头
- 根据你的网络调整：
  - `192.168.1.0/24` - 如果 Lucky 在 192.168.1.x 段
  - `192.168.2.0/24` - 如果 Lucky 在 192.168.2.x 段
  - `10.0.0.0/8` - 如果使用 10.x.x.x 段
  - `172.16.0.0/12` - 如果使用 172.16-31.x.x 段

### 4. `NEXTAUTH_URL` = `https://aiuni.szlk.site`

**说明**:
- ✅ 使用公网域名（不是内网 IP）
- ✅ 使用 `https://`（Lucky 已提供 SSL）
- ✅ 这是用户实际访问的地址

---

## 🔧 Lucky 反向代理配置

在 Lucky 中配置转发规则：

### 转发规则设置

```yaml
域名: aiuni.szlk.site
监听端口: 443 (HTTPS) / 80 (HTTP)
目标地址: http://192.168.2.x:3333
转发协议: HTTP

# 重要设置：
☑️ 启用 SSL/HTTPS
☑️ 自动跳转 HTTPS
☑️ 转发真实 IP (X-Forwarded-For)
☑️ 转发真实协议 (X-Forwarded-Proto)
☑️ WebSocket 支持（如果需要）
```

### Lucky 配置示例

如果使用 Lucky 的配置文件格式：

```json
{
  "domain": "aiuni.szlk.site",
  "listen": "443",
  "target": "http://192.168.2.x:3333",
  "ssl": true,
  "ssl_redirect": true,
  "headers": {
    "X-Forwarded-For": "$remote_addr",
    "X-Forwarded-Proto": "$scheme",
    "X-Real-IP": "$remote_addr"
  }
}
```

---

## ✅ 配置验证

### 1. 检查端口监听

```bash
# SSH 到应用服务器
ssh -p 22223 szlk@192.168.2.x

# 检查 Nginx 是否监听 3333 端口
sudo netstat -tlnp | grep 3333
# 应该看到: nginx ... LISTEN

# 检查 Next.js 是否监听 3000 端口
sudo netstat -tlnp | grep 3000
# 应该看到: node ... LISTEN
```

### 2. 测试内网访问

```bash
# 在应用服务器上测试
curl http://localhost:3333
# 应该返回 HTML 内容

curl http://localhost:3000
# 应该返回 HTML 内容
```

### 3. 测试 Lucky 转发

```bash
# 在任意能访问域名的机器上测试
curl https://aiuni.szlk.site
# 应该返回 HTML 内容

# 检查响应头
curl -I https://aiuni.szlk.site
# 应该看到: HTTP/2 200
```

### 4. 检查真实 IP 传递

部署完成后，查看应用日志：

```bash
# 查看 Nginx 日志
tail -f /var/log/nginx/access.log

# 查看 PM2 日志
pm2 logs homelabs-portal

# 应该看到真实的客户端 IP，而不是 Lucky 的 IP
```

---

## 🚨 常见问题

### Q1: 访问域名返回 502 Bad Gateway

**原因**: Lucky 无法连接到应用服务器的 3333 端口

**解决**:
1. 检查应用服务器防火墙：
   ```bash
   sudo ufw allow 3333/tcp
   ```

2. 检查 Nginx 是否启动：
   ```bash
   sudo systemctl status nginx
   ```

3. 检查 Lucky 配置的目标地址是否正确

---

### Q2: 所有请求 IP 都显示为 Lucky 的 IP

**原因**: 未启用 `BEHIND_PROXY` 或 `PROXY_REAL_IP_FROM` 配置错误

**解决**:
```bash
# 重新配置
gh variable set BEHIND_PROXY -b "true"
gh variable set PROXY_REAL_IP_FROM -b "192.168.2.0/24"

# 重新部署
gh workflow run deploy-local.yml -f deploy_mode=all
```

---

### Q3: HTTPS 跳转循环

**原因**: Nginx 和 Lucky 都在处理 HTTPS 重定向

**解决**: 
- ✅ Lucky 处理 SSL 和 HTTP → HTTPS 重定向
- ✅ Nginx 只监听 HTTP (3333)，不做重定向
- ✅ 不要在工作流中设置 `USE_SSL=true`（Lucky 已处理）

---

### Q4: WebSocket 连接失败

**原因**: Lucky 未启用 WebSocket 支持

**解决**: 在 Lucky 中启用 WebSocket 转发选项

---

## 📋 完整配置清单

### GitHub Variables (8个)

```bash
✅ SERVER_HOST        = "192.168.2.x"
✅ SSH_USER           = "szlk"
✅ SSH_PORT           = "22223"
✅ NEXTAUTH_URL       = "https://aiuni.szlk.site"
✅ NGINX_PORT         = "3333"         ⚠️ 关键
✅ BEHIND_PROXY       = "true"         ⚠️ 关键
✅ PROXY_REAL_IP_FROM = "192.168.2.0/24" ⚠️ 关键
✅ APP_PORT           = "3000"
```

### GitHub Secrets (3个)

```bash
✅ SERVER_SSH_KEY      = (SSH 私钥)
✅ POSTGRES_PASSWORD   = "bD3tddNaIQ/tOSuwbTIiwZecKVR21gHh"
✅ NEXTAUTH_SECRET     = "KSzrdve42s2sTstWypeEMYBqoEdsjKcZYRr9XI4KQhA="
```

### Lucky 配置

```bash
✅ 域名: aiuni.szlk.site
✅ 目标: http://192.168.2.x:3333
✅ SSL: 启用
✅ 转发头: X-Forwarded-For, X-Real-IP
```

---

## 🎉 部署后的访问流程

```
用户浏览器
  ↓
输入: https://aiuni.szlk.site
  ↓
Lucky (443) → SSL 终止
  ↓
转发到: http://192.168.2.x:3333
  ↓
Nginx (3333) → 静态资源 / 反向代理
  ↓
Next.js (3000) → 应用逻辑
  ↓
PostgreSQL (5432) → 数据库
  ↓
响应返回给用户 ✅
```

---

## 🔄 快速配置脚本

```bash
#!/bin/bash
# 一键配置 Lucky 反向代理模式

# Variables
gh variable set SERVER_HOST -b "192.168.2.x"
gh variable set SSH_USER -b "szlk"
gh variable set SSH_PORT -b "22223"
gh variable set NEXTAUTH_URL -b "https://aiuni.szlk.site"
gh variable set NGINX_PORT -b "3333"
gh variable set BEHIND_PROXY -b "true"
gh variable set PROXY_REAL_IP_FROM -b "192.168.2.0/24"
gh variable set APP_PORT -b "3000"
gh variable set PRIMARY_DOMAIN -b "aiuni.szlk.site"

# Secrets
gh secret set SERVER_SSH_KEY < ~/.ssh/homelabs_deploy
gh secret set POSTGRES_PASSWORD -b "bD3tddNaIQ/tOSuwbTIiwZecKVR21gHh"
gh secret set NEXTAUTH_SECRET -b "KSzrdve42s2sTstWypeEMYBqoEdsjKcZYRr9XI4KQhA="

echo "✅ 配置完成！"
echo "📝 下一步："
echo "1. 在 Lucky 中配置转发规则"
echo "2. 运行部署: gh workflow run deploy-local.yml -f deploy_mode=all"
```

---

**关键总结**:
- ✅ `NGINX_PORT` = **3333**（或其他非标准端口，避免与 Lucky 的 80/443 冲突）
- ✅ `BEHIND_PROXY` = **true**（获取真实客户端 IP）
- ✅ `NEXTAUTH_URL` = **https://aiuni.szlk.site**（使用公网域名）
- ✅ Lucky 监听 **80/443**，转发到 **3333**

