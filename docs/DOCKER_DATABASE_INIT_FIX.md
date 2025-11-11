# Docker数据库初始化修复说明

## 🔍 问题诊断

根据错误日志分析，主要问题是：
1. **数据库表结构未初始化** - Docker容器启动时，数据库是空的，没有创建必要的表
2. **NextAuth返回HTML而不是JSON** - 这通常意味着服务器端出现了未处理的错误，返回了错误页面
3. **所有API返回500错误** - 因为数据库连接或查询失败

## ✅ 已实施的修复

### 1. 创建数据库初始化启动脚本

创建了 `docker/docker-entrypoint.sh`，在容器启动时：
- 等待数据库就绪
- 自动运行 `prisma db push` 初始化数据库表结构
- 然后启动Next.js应用

### 2. 更新Dockerfile

- 复制Prisma相关文件到最终镜像
- 复制启动脚本并设置为可执行
- 使用启动脚本作为ENTRYPOINT

### 3. 更新docker-compose.yml

- 添加数据库和Redis的健康检查
- 设置应用容器等待数据库健康后再启动
- 默认NEXTAUTH_URL设置为 `https://aiuni.szlk.site`
- 启用DEBUG模式以便查看详细错误

## 🚀 应用修复的步骤

### 步骤1: 重新构建Docker镜像

```bash
cd docker
docker-compose down
docker-compose build --no-cache
```

### 步骤2: 启动容器

```bash
docker-compose up -d
```

### 步骤3: 查看启动日志

```bash
# 查看应用容器日志，确认数据库初始化成功
docker logs homelabs-app -f

# 应该看到类似输出：
# 🚀 启动应用容器...
# ⏳ 等待数据库连接并初始化...
# ✅ 数据库已就绪并初始化完成
# 🚀 启动Next.js应用...
```

### 步骤4: 验证数据库表已创建

```bash
# 进入数据库容器
docker exec -it homelabs-postgres psql -U postgres -d homelabs_portal

# 查看表列表
\dt

# 应该看到以下表：
# - users
# - projects
# - accounts
# - sessions
# - verification_tokens
```

### 步骤5: 测试API

```bash
# 测试健康检查端点
curl http://localhost:6000/api/health

# 应该返回JSON响应，包含数据库连接状态
```

## 🔧 如果问题仍然存在

### 检查1: 查看详细错误日志

```bash
# 查看应用容器日志
docker logs homelabs-app --tail 100

# 查看数据库容器日志
docker logs homelabs-postgres --tail 50
```

### 检查2: 手动初始化数据库

如果自动初始化失败，可以手动执行：

```bash
# 进入应用容器
docker exec -it homelabs-app sh

# 手动运行数据库迁移
node node_modules/prisma/build/index.js db push --accept-data-loss

# 或者如果npx可用
npx prisma db push --accept-data-loss
```

### 检查3: 验证环境变量

```bash
# 检查应用容器的环境变量
docker exec homelabs-app env | grep -E "DATABASE_URL|NEXTAUTH"

# 应该看到：
# DATABASE_URL=postgresql://postgres:password@postgres:5432/homelabs_portal
# NEXTAUTH_URL=https://aiuni.szlk.site
```

### 检查4: 测试数据库连接

```bash
# 从应用容器测试数据库连接
docker exec homelabs-app node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`.then(() => {
  console.log('✅ 数据库连接成功');
  process.exit(0);
}).catch(err => {
  console.error('❌ 数据库连接失败:', err.message);
  process.exit(1);
});
"
```

## 📋 验证清单

在报告问题前，请确认：

- [ ] 已重新构建镜像: `docker-compose build --no-cache`
- [ ] 已查看启动日志: `docker logs homelabs-app`
- [ ] 数据库表已创建: `docker exec homelabs-postgres psql -U postgres -d homelabs_portal -c "\dt"`
- [ ] 环境变量正确: `docker exec homelabs-app env | grep DATABASE_URL`
- [ ] 健康检查通过: `curl http://localhost:6000/api/health`

## 🎯 预期结果

修复后，您应该能够：
1. ✅ 成功访问注册页面
2. ✅ 成功注册新用户
3. ✅ 成功登录
4. ✅ 所有API返回正确的JSON响应（不再是HTML错误页面）
5. ✅ 字体和样式正常加载（CSP问题已解决）

