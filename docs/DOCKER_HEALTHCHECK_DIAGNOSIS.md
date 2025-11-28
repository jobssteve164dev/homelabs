# Docker All-in-One 健康检查问题诊断指南

## 🔍 问题现象

- 容器日志显示应用启动成功
- 网站可以正常访问
- 但 Docker 健康检查持续显示"不健康"状态

## 🎯 根本原因分析

### 可能的原因

1. **环境变量传递问题**
   - `DATABASE_URL` 在启动脚本中设置，但可能没有正确传递到 Next.js 应用进程
   - `su-exec` 可能会清除某些环境变量

2. **数据库连接时机问题**
   - 健康检查在应用完全启动前执行
   - Prisma 客户端初始化需要时间
   - 数据库连接池尚未建立

3. **日志输出被重定向**
   - 应用日志被重定向到文件，容器日志看不到详细错误
   - 健康检查的错误信息没有被捕获

4. **数据库连接配置问题**
   - `DATABASE_URL` 格式不正确
   - 数据库用户权限不足
   - 数据库服务未完全启动

## 🔧 诊断步骤

### 步骤 1: 检查容器健康状态

```bash
# 查看容器健康状态详情
docker inspect <container-name> | jq '.[0].State.Health'

# 查看健康检查历史记录
docker inspect <container-name> | jq '.[0].State.Health.Log[-10:]'
```

### 步骤 2: 手动测试健康检查端点

```bash
# 在容器内测试
docker exec <container-name> wget -q -O - http://localhost:3000/api/health | jq

# 从宿主机测试
curl http://localhost:3000/api/health | jq

# 查看详细响应
curl -v http://localhost:3000/api/health
```

### 步骤 3: 检查环境变量

```bash
# 检查容器内的环境变量
docker exec <container-name> env | grep DATABASE_URL

# 检查启动脚本中的环境变量设置
docker exec <container-name> cat /app/docker-entrypoint.sh | grep DATABASE_URL
```

### 步骤 4: 检查数据库连接

```bash
# 检查 PostgreSQL 是否运行
docker exec <container-name> su-exec postgres pg_isready

# 检查数据库连接
docker exec <container-name> su-exec postgres psql -U homelabs -d homelabs_portal -c "SELECT 1;"
```

### 步骤 5: 查看应用日志

```bash
# 查看容器日志（最近 100 行）
docker logs <container-name> --tail 100

# 查看应用日志文件
docker exec <container-name> tail -f /app/logs/app/app-$(date +%Y-%m-%d).log

# 查看组合日志
docker exec <container-name> tail -f /app/logs/combined.log

# 搜索健康检查相关错误
docker logs <container-name> 2>&1 | grep -i "health"
```

### 步骤 6: 检查 Prisma 客户端

```bash
# 检查 Prisma 客户端是否已生成
docker exec <container-name> ls -la /app/node_modules/.prisma/client

# 检查 Prisma schema
docker exec <container-name> cat /app/prisma/schema.prisma | grep datasource
```

## 🛠️ 修复方案

### 修复 1: 确保环境变量传递

已在 `docker-entrypoint-allinone.sh` 中修复：

```bash
# 显式传递 DATABASE_URL 到子进程
exec su-exec nextjs sh -c "export DATABASE_URL='$DATABASE_URL' && ..."
```

### 修复 2: 增强错误诊断

健康检查端点现在会：
- 记录详细的错误信息
- 检查 `DATABASE_URL` 是否设置
- 输出诊断信息到日志

### 修复 3: 改进日志输出

启动脚本现在会：
- 在启动前记录环境变量状态
- 确保错误输出被正确捕获
- 同时输出到容器日志和文件日志

## 📊 验证修复

### 验证 1: 检查环境变量传递

```bash
# 重启容器后，检查环境变量
docker restart <container-name>
sleep 10
docker exec <container-name> env | grep DATABASE_URL
```

应该看到：
```
DATABASE_URL=postgresql://homelabs:***@localhost:5432/homelabs_portal?schema=public
```

### 验证 2: 测试健康检查端点

```bash
# 等待容器完全启动（至少 180 秒）
sleep 180

# 测试健康检查
curl http://localhost:3000/api/health | jq
```

应该返回：
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "connected",
      "latency": "XXms"
    },
    "application": {
      "status": "running"
    }
  }
}
```

### 验证 3: 检查容器健康状态

```bash
# 等待健康检查完成（启动后 3-5 分钟）
docker inspect <container-name> | jq '.[0].State.Health.Status'
```

应该返回：`"healthy"`

## 🚨 常见问题

### Q1: 健康检查一直失败，但网站可以访问

**可能原因**：
- 健康检查端点返回 503（数据库连接失败）
- 但网站的其他功能不依赖数据库，所以可以访问

**解决方案**：
1. 检查数据库连接配置
2. 查看应用日志中的数据库错误
3. 验证 `DATABASE_URL` 是否正确

### Q2: 日志很少，看不到错误信息

**可能原因**：
- 日志被重定向到文件
- 错误输出没有被捕获

**解决方案**：
1. 查看文件日志：`/app/logs/app/app-YYYY-MM-DD.log`
2. 查看组合日志：`/app/logs/combined.log`
3. 使用 `docker logs` 查看容器日志

### Q3: 数据库连接失败

**可能原因**：
- `DATABASE_URL` 格式错误
- 数据库用户权限不足
- 数据库服务未完全启动

**解决方案**：
1. 检查 `DATABASE_URL` 格式
2. 验证数据库用户和密码
3. 检查 PostgreSQL 日志：`/app/logs/postgresql/postgresql-YYYY-MM-DD.log`

## 📝 相关文档

- [Docker All-in-One 部署指南](./DOCKER_ALLINONE_DEPLOYMENT.md)
- [健康检查优化指南](./DOCKER_HEALTHCHECK_OPTIMIZATION.md)
- [日志系统说明](./LOGGING.md)

---

**最后更新**: 2025-11-28  
**维护者**: HOMELABS Team

