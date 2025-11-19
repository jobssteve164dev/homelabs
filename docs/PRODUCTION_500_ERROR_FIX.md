# 生产环境500错误修复报告

## 🔍 问题诊断

根据浏览器控制台错误日志，发现以下问题：

1. **`/api/auth/session` 返回500错误**
2. **`/api/galaxies` 返回500错误**
3. **错误响应为HTML而不是JSON** - 这通常意味着服务器返回了错误页面，而不是API错误响应

## ✅ 已实施的修复

### 1. NextAuth配置修复

**问题**: NextAuth配置中缺少`secret`配置项，导致认证服务无法正常工作。

**修复位置**: `client/src/lib/auth.ts`

**修复内容**:
```typescript
export const authOptions = {
  // ... 其他配置
  secret: process.env.NEXTAUTH_SECRET,  // 新增
  trustHost: true,
};
```

### 2. 错误处理增强

**问题**: API端点错误处理不够详细，无法快速定位问题。

**修复位置**: `client/src/app/api/galaxies/route.ts`

**修复内容**:
- 增强了错误日志记录，包含端点和方法信息
- 在调试模式下（`DEBUG=true`）返回详细的错误信息，包括错误类型和堆栈跟踪

### 3. 环境变量验证

**问题**: 缺少启动时的环境变量验证，导致配置错误难以发现。

**修复位置**: 
- `client/src/lib/auth.ts` - 添加NEXTAUTH_SECRET验证
- `client/src/app/api/auth/[...nextauth]/route.ts` - 添加环境变量检查

## 🚀 应用修复的步骤

### 步骤1: 重新构建和部署

如果使用Docker部署：

```bash
cd docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

如果使用直接部署：

```bash
cd client
npm run build
# 重启应用服务
```

### 步骤2: 验证环境变量

确保以下环境变量已正确设置：

```bash
# 必需的环境变量
NEXTAUTH_SECRET=<强随机密钥>
NEXTAUTH_URL=https://aiuni.szlk.site
DATABASE_URL=postgresql://postgres:password@postgres:5432/homelabs_portal
DEBUG=true  # 用于查看详细错误信息
```

### 步骤3: 检查应用日志

```bash
# Docker部署
docker logs homelabs-app -f

# 直接部署
# 查看 logs/error-*.log 文件
```

应该看到：
- ✅ 环境变量验证通过
- ✅ 数据库连接成功
- ✅ NextAuth配置加载成功

### 步骤4: 测试API端点

```bash
# 测试健康检查
curl https://aiuni.szlk.site/api/health

# 测试星系列表（应该返回JSON错误，而不是HTML）
curl https://aiuni.szlk.site/api/galaxies

# 测试认证端点
curl https://aiuni.szlk.site/api/auth/session
```

## 🔧 如果问题仍然存在

### 检查1: 数据库连接

```bash
# 进入数据库容器
docker exec -it homelabs-postgres psql -U postgres -d homelabs_portal

# 检查表是否存在
\dt

# 应该看到: users, projects, accounts, sessions, verification_tokens
```

### 检查2: NextAuth配置

确认`NEXTAUTH_SECRET`已设置且长度足够（至少32字符）：

```bash
# 在容器内检查
docker exec homelabs-app env | grep NEXTAUTH
```

### 检查3: 查看详细错误日志

由于`DEBUG=true`已设置，API错误响应现在会包含详细信息：

```json
{
  "success": false,
  "error": "获取星系列表失败",
  "details": "具体的错误信息",
  "type": "错误类型",
  "stack": ["堆栈跟踪信息"]
}
```

### 检查4: Nginx配置

如果使用Nginx反向代理，确保：

1. **代理配置正确**:
```nginx
location /api/ {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

2. **错误页面不会覆盖API响应**:
```nginx
# 确保不会返回自定义错误页面
error_page 500 /50x.html;
location = /50x.html {
    # 对于API请求，应该返回JSON而不是HTML
}
```

## 📋 常见问题

### Q1: 为什么返回HTML而不是JSON？

**A**: 这通常意味着：
1. Next.js应用没有正确启动
2. Nginx配置返回了错误页面
3. API路由没有正确注册

**解决方案**: 
- 检查应用容器是否正常运行: `docker ps`
- 检查应用日志: `docker logs homelabs-app`
- 检查Nginx配置是否正确代理到应用

### Q2: NEXTAUTH_SECRET如何生成？

**A**: 使用以下命令生成：

```bash
# 方法1: 使用openssl
openssl rand -base64 32

# 方法2: 使用Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Q3: 如何确认修复是否生效？

**A**: 
1. 检查浏览器控制台 - 应该看到JSON格式的错误响应，而不是HTML
2. 检查应用日志 - 应该看到详细的错误信息
3. 测试API端点 - 即使失败，也应该返回JSON格式的错误

## 📝 修复文件清单

- ✅ `client/src/lib/auth.ts` - NextAuth配置修复
- ✅ `client/src/app/api/galaxies/route.ts` - 错误处理增强
- ✅ `client/src/app/api/auth/[...nextauth]/route.ts` - 环境变量验证

## 🎯 下一步

1. **重新部署应用** - 应用上述修复
2. **监控错误日志** - 查看修复后的详细错误信息
3. **根据错误信息进一步调试** - 如果仍有问题，根据新的错误信息定位根本原因

---

**最后更新**: 2025-01-22
**修复版本**: v1.0

