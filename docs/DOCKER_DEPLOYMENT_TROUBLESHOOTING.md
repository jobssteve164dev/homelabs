# Docker部署问题诊断与修复指南

## 🔍 已修复的问题

### 1. ✅ CSP策略过严导致字体加载失败

**问题**: Content Security Policy阻止了Google Fonts和阿里云字体的加载

**修复内容**:
- ✅ 更新了 `docker/nginx.conf` 中的CSP策略，允许：
  - `https://fonts.googleapis.com` (样式表)
  - `https://fonts.gstatic.com` (字体文件)
  - `https://at.alicdn.com` (阿里云图标字体)
- ✅ 更新了 `client/next.config.ts` 中的CSP策略，保持一致性

**验证方法**: 刷新页面后，字体应能正常加载，控制台不再出现CSP违规错误

---

### 2. ✅ API错误处理增强

**问题**: API返回500错误时，无法看到具体错误信息

**修复内容**:
- ✅ 增强了 `/api/auth/register` 的错误处理
- ✅ 增强了 `/api/galaxies` 的错误处理
- ✅ 在开发环境或调试模式下，API会返回详细的错误信息

**使用方法**: 
- 在 `docker-compose.yml` 中设置 `DEBUG=true` 环境变量
- 重启容器后，API错误响应将包含 `details` 和 `type` 字段

---

### 3. ✅ NEXTAUTH_URL配置说明

**问题**: `docker-compose.yml` 中的 `NEXTAUTH_URL` 配置可能不正确

**修复内容**:
- ✅ 添加了详细的配置注释
- ✅ 支持通过环境变量覆盖默认值

**重要配置**:
```yaml
# ⚠️ 重要: NEXTAUTH_URL 必须设置为实际的外部访问地址
# 如果通过域名访问，应设置为: https://aiuni.szlk.site
# 如果通过IP访问，应设置为: http://your-server-ip:680
- NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:6000}
```

---

## 🚀 应用修复的步骤

### 步骤1: 更新NEXTAUTH_URL配置

如果您的应用通过域名 `aiuni.szlk.site` 访问，需要更新 `docker-compose.yml`:

```bash
# 方法1: 直接修改docker-compose.yml
# 将 NEXTAUTH_URL 改为: https://aiuni.szlk.site

# 方法2: 使用环境变量（推荐）
export NEXTAUTH_URL=https://aiuni.szlk.site
docker-compose up -d
```

### 步骤2: 启用调试模式（可选）

如果需要查看详细的错误信息，在 `docker-compose.yml` 中设置：

```yaml
- DEBUG=true
```

### 步骤3: 重新构建并启动容器

```bash
cd docker
docker-compose down
docker-compose build
docker-compose up -d
```

### 步骤4: 检查容器日志

```bash
# 查看应用容器日志
docker logs homelabs-app -f

# 查看nginx容器日志
docker logs homelabs-nginx -f
```

---

## 🔧 常见问题诊断

### 问题1: API返回500错误

**诊断步骤**:

1. **检查数据库连接**:
   ```bash
   # 进入应用容器
   docker exec -it homelabs-app sh
   
   # 测试数据库连接
   npx prisma db pull
   ```

2. **检查环境变量**:
   ```bash
   docker exec homelabs-app env | grep -E "DATABASE_URL|NEXTAUTH"
   ```

3. **查看详细错误**:
   - 设置 `DEBUG=true` 环境变量
   - 重启容器
   - 再次尝试注册/登录
   - 查看浏览器控制台的错误响应，应该包含 `details` 字段

4. **检查数据库是否已初始化**:
   ```bash
   docker exec -it homelabs-postgres psql -U postgres -d homelabs_portal -c "\dt"
   ```
   
   如果表不存在，需要运行迁移：
   ```bash
   docker exec -it homelabs-app npx prisma db push
   ```

### 问题2: NextAuth返回HTML而不是JSON

**可能原因**:
1. `NEXTAUTH_URL` 配置不正确
2. NextAuth内部错误，返回了错误页面

**解决方法**:

1. **确认NEXTAUTH_URL**:
   ```bash
   docker exec homelabs-app env | grep NEXTAUTH_URL
   ```
   
   应该显示实际的外部访问地址（如 `https://aiuni.szlk.site`）

2. **检查NextAuth配置**:
   - 确认 `NEXTAUTH_SECRET` 已设置
   - 确认 `trustHost: true` 在 `authOptions` 中

3. **查看NextAuth日志**:
   ```bash
   docker logs homelabs-app | grep -i "nextauth\|auth"
   ```

### 问题3: 字体仍然无法加载

**检查清单**:

1. ✅ 确认已更新 `docker/nginx.conf` 和 `client/next.config.ts`
2. ✅ 确认已重新构建容器: `docker-compose build`
3. ✅ 确认nginx配置已重新加载: `docker-compose restart nginx`
4. ✅ 清除浏览器缓存并硬刷新 (Ctrl+Shift+R)

### 问题4: 数据库连接失败

**诊断步骤**:

1. **检查数据库容器状态**:
   ```bash
   docker ps | grep postgres
   ```

2. **检查数据库连接字符串**:
   ```bash
   docker exec homelabs-app env | grep DATABASE_URL
   ```
   
   应该显示: `postgresql://postgres:password@postgres:5432/homelabs_portal`

3. **测试网络连接**:
   ```bash
   docker exec homelabs-app ping postgres
   ```

4. **检查数据库是否可访问**:
   ```bash
   docker exec -it homelabs-postgres psql -U postgres -d homelabs_portal -c "SELECT 1;"
   ```

---

## 📋 快速检查清单

在报告问题前，请确认：

- [ ] 已更新 `docker-compose.yml` 中的 `NEXTAUTH_URL`
- [ ] 已重新构建容器: `docker-compose build`
- [ ] 已重启所有容器: `docker-compose restart`
- [ ] 已检查容器日志: `docker logs homelabs-app`
- [ ] 已检查数据库连接: `docker exec homelabs-app npx prisma db pull`
- [ ] 已清除浏览器缓存
- [ ] 已启用调试模式查看详细错误

---

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. **容器日志**:
   ```bash
   docker logs homelabs-app --tail 100
   docker logs homelabs-nginx --tail 100
   ```

2. **环境变量**:
   ```bash
   docker exec homelabs-app env
   ```

3. **浏览器控制台错误** (F12 -> Console)

4. **网络请求详情** (F12 -> Network -> 查看失败的请求)

5. **数据库状态**:
   ```bash
   docker exec -it homelabs-postgres psql -U postgres -d homelabs_portal -c "\dt"
   ```


