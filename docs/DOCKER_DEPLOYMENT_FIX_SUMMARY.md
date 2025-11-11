# Docker部署问题修复总结

## 🔍 问题诊断

根据错误日志分析，主要问题包括：
1. **数据库表结构未初始化** - Docker容器启动时，数据库是空的，没有创建必要的表
2. **CSP策略过严** - 阻止了Google Fonts和阿里云字体的加载
3. **NextAuth返回HTML而不是JSON** - 服务器端错误导致返回错误页面
4. **所有API返回500错误** - 因为数据库连接或查询失败

## ✅ 已实施的修复

### 1. 数据库自动初始化

**修改文件**: `docker/Dockerfile`, `docker/docker-entrypoint.sh`

- ✅ 创建了启动脚本 `docker-entrypoint.sh`，在容器启动时自动初始化数据库
- ✅ 更新了Dockerfile，复制Prisma相关文件和启动脚本
- ✅ 启动脚本会等待数据库就绪，然后运行 `prisma db push` 创建表结构

**关键代码**:
```dockerfile
# Dockerfile中添加
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma
COPY docker/docker-entrypoint.sh ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
```

### 2. CSP策略修复

**修改文件**: 
- `.github/scripts/generate-docker-config.sh` (工作流使用的配置生成脚本)
- `docker/nginx.conf` (本地开发配置)
- `client/next.config.ts` (Next.js配置)

- ✅ 允许 `https://fonts.googleapis.com` (Google Fonts样式表)
- ✅ 允许 `https://fonts.gstatic.com` (Google Fonts字体文件)
- ✅ 允许 `https://at.alicdn.com` (阿里云图标字体)

**修复内容**:
```nginx
# 修复前
style-src 'self' 'unsafe-inline';
font-src 'self' data:;

# 修复后
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' data: https://fonts.gstatic.com https://at.alicdn.com;
```

### 3. API错误处理增强

**修改文件**: 
- `client/src/app/api/auth/register/route.ts`
- `client/src/app/api/galaxies/route.ts`

- ✅ 在开发环境或调试模式下，API会返回详细的错误信息
- ✅ 使用统一的日志系统 `logError` 替代 `console.error`

### 4. 工作流配置更新

**修改文件**: `.github/scripts/generate-docker-config.sh`

- ✅ 添加了 `DEBUG` 环境变量支持
- ✅ 更新了生成的nginx配置中的CSP策略
- ✅ 确保生成的docker-compose配置包含健康检查

## 🚀 部署流程

### 通过GitHub Actions工作流部署

1. **触发部署**: 
   - 修改 `changelog.md` 并推送到 `main` 分支
   - 或手动触发工作流，选择部署模式

2. **工作流会自动**:
   - 生成 `docker-compose-auto.yml` (包含所有修复)
   - 生成 `docker/nginx-auto.conf` (包含修复的CSP策略)
   - 构建Docker镜像 (使用修复后的Dockerfile)
   - 启动容器 (自动初始化数据库)

3. **验证部署**:
   ```bash
   # 查看容器日志，确认数据库初始化成功
   docker logs homelabs-app -f
   
   # 应该看到：
   # 🚀 启动应用容器...
   # ⏳ 等待数据库连接并初始化...
   # ✅ 数据库已就绪并初始化完成
   # 🚀 启动Next.js应用...
   ```

### 本地测试部署

如果需要本地测试修复：

```bash
cd docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 查看日志
docker logs homelabs-app -f
```

## 📋 修复验证清单

部署后，请验证：

- [ ] **数据库表已创建**:
  ```bash
  docker exec -it homelabs-postgres psql -U postgres -d homelabs_portal -c "\dt"
  # 应该看到: users, projects, accounts, sessions, verification_tokens
  ```

- [ ] **字体正常加载**: 
  - 打开浏览器开发者工具
  - 检查Console，不应有CSP违规错误
  - 页面字体应正常显示

- [ ] **API正常响应**:
  ```bash
  curl https://aiuni.szlk.site/api/health
  # 应该返回JSON，包含数据库连接状态
  ```

- [ ] **注册功能正常**:
  - 访问注册页面
  - 填写表单并提交
  - 应该成功注册，不再出现500错误

- [ ] **NextAuth正常**:
  - 访问 `/api/auth/session`
  - 应该返回JSON，而不是HTML错误页面

## 🔧 如果问题仍然存在

### 检查1: 查看容器日志

```bash
# 应用容器日志
docker logs homelabs-app --tail 100

# 数据库容器日志
docker logs homelabs-postgres --tail 50
```

### 检查2: 手动初始化数据库

如果自动初始化失败：

```bash
docker exec -it homelabs-app sh
node node_modules/prisma/build/index.js db push --accept-data-loss
```

### 检查3: 验证环境变量

```bash
docker exec homelabs-app env | grep -E "DATABASE_URL|NEXTAUTH_URL|DEBUG"
```

### 检查4: 启用调试模式

在GitHub Actions的Variables中设置 `DEBUG=true`，重新部署后API会返回详细错误信息。

## 📝 相关文件清单

### 核心修复文件
- `docker/Dockerfile` - Docker镜像构建配置
- `docker/docker-entrypoint.sh` - 容器启动脚本（数据库初始化）
- `docker/docker-compose.yml` - 本地开发配置（已更新）

### 工作流相关文件
- `.github/scripts/generate-docker-config.sh` - 配置生成脚本（已更新）
- `.github/workflows/deploy-docker.yml` - 部署工作流

### 应用配置
- `client/next.config.ts` - Next.js配置（CSP策略已更新）
- `client/src/app/api/auth/register/route.ts` - 注册API（错误处理已增强）
- `client/src/app/api/galaxies/route.ts` - 星系列表API（错误处理已增强）

### 文档
- `docs/DOCKER_DEPLOYMENT_TROUBLESHOOTING.md` - 详细故障排除指南
- `docs/DOCKER_DATABASE_INIT_FIX.md` - 数据库初始化修复说明

## 🎯 预期结果

修复后，您应该能够：
1. ✅ 成功访问注册页面，字体正常显示
2. ✅ 成功注册新用户（不再出现500错误）
3. ✅ 成功登录
4. ✅ 所有API返回正确的JSON响应（不再是HTML错误页面）
5. ✅ 数据库表自动创建，无需手动初始化

## ⚠️ 重要提示

1. **首次部署**: 数据库初始化可能需要30-60秒，请耐心等待
2. **重新部署**: 如果数据库已存在，`prisma db push` 会安全地更新表结构，不会丢失数据
3. **调试模式**: 生产环境建议将 `DEBUG` 设置为 `false`，避免暴露敏感错误信息

