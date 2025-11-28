# Docker All-in-One 健康检查优化指南

## 📋 问题背景

在 Docker All-in-One 部署模式下，容器健康检查持续报告"不健康"状态，但服务实际上能够正常运行和响应请求。

### 原始配置的问题

```dockerfile
# 原始健康检查配置
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1
```

**主要问题：**

1. **启动时间不足**：All-in-One 容器需要按顺序启动：
   - PostgreSQL 初始化和启动（~30-40秒）
   - 数据库用户和权限配置（~5-10秒）
   - Prisma 数据库迁移（~20-30秒）
   - Next.js 应用启动（~20-40秒）
   - **总计：约 75-120 秒**
   - 原配置的 `start-period=90s` 不够充裕

2. **超时时间过短**：`timeout=10s` 对于包含数据库查询的健康检查过短，特别是：
   - 冷启动时 Prisma 客户端初始化需要时间
   - 首次数据库连接建立需要时间
   - 网络延迟和系统负载影响

3. **重试次数过少**：`retries=3` 在负载较高或资源受限时容易误判

4. **工具依赖问题**：使用 `wget` 但 Alpine 基础镜像默认不包含，虽然后续添加了，但使用 Node.js 内置模块更可靠

5. **缺乏详细诊断**：健康检查失败时没有提供足够的诊断信息

---

## ✅ 优化方案

### 1. Dockerfile 健康检查配置优化

```dockerfile
# 优化后的健康检查配置
HEALTHCHECK --interval=30s --timeout=30s --start-period=180s --retries=5 \
    CMD node -e "const http = require('http'); \
        const req = http.get('http://localhost:3000/api/health', {timeout: 25000}, (res) => { \
            if (res.statusCode === 200) { process.exit(0); } \
            else { console.error('Health check failed: HTTP ' + res.statusCode); process.exit(1); } \
        }); \
        req.on('error', (e) => { console.error('Health check error:', e.message); process.exit(1); }); \
        req.on('timeout', () => { console.error('Health check timeout'); req.destroy(); process.exit(1); });" \
    || exit 1
```

**优化点：**

| 参数 | 原值 | 新值 | 说明 |
|------|------|------|------|
| `timeout` | 10s | 30s | 增加到 30 秒，确保数据库查询有足够时间完成 |
| `start-period` | 90s | 180s | 增加到 3 分钟，完全覆盖 All-in-One 启动流程 |
| `retries` | 3 | 5 | 提高容错性，避免偶发性延迟导致误判 |
| 检查工具 | `wget` | Node.js 内置 `http` | 无需额外依赖，更可靠 |

**工作流程：**

```
容器启动
   ↓
0-180秒: 宽限期（不计入健康状态）
   ↓
180秒后: 开始第一次健康检查
   ↓
每30秒: 执行一次检查（最多等待30秒）
   ↓
连续5次失败: 标记为不健康
```

### 2. 健康检查端点优化

#### 新增功能

1. **超时控制**：
   ```typescript
   const HEALTH_CHECK_TIMEOUT = 20000; // 20秒
   
   const healthCheckPromise = performHealthCheck();
   const timeoutPromise = new Promise<never>((_, reject) => {
     setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT);
   });
   
   const result = await Promise.race([healthCheckPromise, timeoutPromise]);
   ```

2. **性能分级**：
   ```typescript
   // 根据数据库响应时间分级
   if (dbLatency < 1000) {
     dbStatus = 'connected';      // 正常
   } else {
     dbStatus = 'slow';            // 降级（但仍然可用）
     console.warn(`Database is slow: ${dbLatency}ms`);
   }
   ```

3. **详细诊断信息**：
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-01-28T10:30:15.123Z",
     "duration": "245ms",
     "services": {
       "database": {
         "status": "connected",
         "latency": "234ms"
       },
       "application": {
         "status": "running",
         "environment": "production",
         "uptime": "3600s"
       }
     },
     "metadata": {
       "architecture": "all-in-one",
       "nodeVersion": "v20.11.0"
     }
   }
   ```

4. **错误日志增强**：
   ```typescript
   console.error(`[Health Check] Failed after ${duration}ms:`, error);
   ```

---

## 📊 健康状态说明

### 状态类型

| 状态 | HTTP 状态码 | 说明 | Docker 健康状态 |
|------|------------|------|----------------|
| `healthy` | 200 | 所有服务正常 | ✅ Healthy |
| `degraded` | 200 | 服务可用但性能降级（如数据库慢） | ✅ Healthy |
| `unhealthy` | 503 | 关键服务不可用（如数据库断开） | ❌ Unhealthy |

### 判断逻辑

```
数据库响应时间 < 1秒
   ↓ YES
   ✅ healthy

   ↓ NO
数据库响应时间 < 超时时间
   ↓ YES
   ⚠️ degraded (仍返回 200)

   ↓ NO
   ❌ unhealthy (返回 503)
```

---

## 🚀 部署说明

### 自动部署

健康检查优化已集成到 GitHub Actions 自动部署流程中。

**触发方式：**

1. **修改 `changelog.md`** 并推送到 `main` 分支（推荐）
2. **手动触发** GitHub Actions 工作流

### 手动部署

如果需要手动更新生产环境的健康检查配置：

```bash
# 1. SSH 到生产服务器
ssh user@your-server

# 2. 进入部署目录
cd /opt/homelabs

# 3. 拉取最新代码
git pull origin main

# 4. 重新构建镜像（会应用新的健康检查配置）
docker build -t homelabs-allinone:latest -f docker/Dockerfile.allinone .

# 5. 停止并删除旧容器
docker stop homelabs-allinone
docker rm homelabs-allinone

# 6. 启动新容器
docker run -d \
  --name homelabs-allinone \
  --restart unless-stopped \
  -p 3000:3000 \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
  -e NEXTAUTH_SECRET="${NEXTAUTH_SECRET}" \
  -e NEXTAUTH_URL="${NEXTAUTH_URL}" \
  -v homelabs-data:/var/lib/postgresql/data \
  -v homelabs-logs:/app/logs \
  homelabs-allinone:latest

# 7. 观察容器启动和健康状态
docker logs -f homelabs-allinone
```

---

## 🔍 监控和故障排查

### 查看容器健康状态

```bash
# 查看容器详细信息（包括健康状态）
docker inspect homelabs-allinone | jq '.[0].State.Health'

# 输出示例：
{
  "Status": "healthy",
  "FailingStreak": 0,
  "Log": [
    {
      "Start": "2025-01-28T10:30:15.123456Z",
      "End": "2025-01-28T10:30:15.456789Z",
      "ExitCode": 0,
      "Output": ""
    }
  ]
}
```

### 查看健康检查日志

```bash
# 查看最近的健康检查日志
docker inspect homelabs-allinone | jq '.[0].State.Health.Log[-5:]'

# 查看容器日志中的健康检查错误
docker logs homelabs-allinone 2>&1 | grep -i "health"
```

### 手动测试健康检查端点

```bash
# 在容器内测试
docker exec homelabs-allinone wget -q -O - http://localhost:3000/api/health | jq

# 从宿主机测试
curl http://localhost:3000/api/health | jq

# 测量响应时间
time curl -s http://localhost:3000/api/health | jq
```

### 常见问题排查

#### 问题 1：启动后长时间处于 "starting" 状态

**原因**：正常现象，All-in-One 模式需要 2-3 分钟完成初始化

**解决方案**：
```bash
# 查看启动日志
docker logs -f homelabs-allinone

# 关注以下关键日志：
# ✅ "PostgreSQL 已启动"
# ✅ "数据库迁移完成"
# ✅ "Next.js 应用启动中..."
# ✅ "Listening on http://0.0.0.0:3000"
```

#### 问题 2：健康检查一直失败

**可能原因：**
- 数据库连接配置错误
- 端口被占用
- 资源不足（内存、CPU）

**排查步骤：**
```bash
# 1. 检查应用是否真的在运行
curl -I http://localhost:3000/api/health

# 2. 检查数据库是否可连接
docker exec homelabs-allinone su-exec postgres pg_isready

# 3. 查看详细错误日志
docker logs homelabs-allinone --tail 100

# 4. 检查资源使用情况
docker stats homelabs-allinone
```

#### 问题 3：健康检查超时

**可能原因：**
- 系统负载过高
- 数据库查询缓慢
- 内存不足导致交换

**解决方案：**
```bash
# 检查系统资源
free -h
top

# 检查容器资源限制
docker inspect homelabs-allinone | jq '.[0].HostConfig | {Memory, CpuShares}'

# 如果资源不足，可以增加容器资源限制：
docker update --memory=4g --memory-swap=4g homelabs-allinone
docker restart homelabs-allinone
```

---

## 📈 性能基准

### 预期健康检查响应时间

| 场景 | 数据库延迟 | 总响应时间 | 状态 |
|------|-----------|-----------|------|
| 理想情况 | < 50ms | < 100ms | ✅ healthy |
| 正常负载 | 50-500ms | 100-600ms | ✅ healthy |
| 高负载 | 500ms-1s | 600ms-1.2s | ⚠️ degraded |
| 严重负载 | > 1s | > 1.5s | ⚠️ degraded |
| 数据库故障 | 超时 | 20s (超时) | ❌ unhealthy |

### 容器启动时间线

```
T+0s:    容器启动
T+5s:    日志系统初始化完成
T+15s:   PostgreSQL 初始化完成
T+25s:   PostgreSQL 启动完成
T+35s:   数据库用户和权限配置完成
T+50s:   Prisma 数据库迁移开始
T+70s:   Prisma 数据库迁移完成
T+90s:   Next.js 应用开始编译
T+120s:  Next.js 应用启动完成
T+180s:  首次健康检查（宽限期结束）
T+210s:  第二次健康检查
T+240s:  容器标记为健康（如果检查通过）
```

---

## 🔄 版本历史

### v2.0 (2025-01-28) - 当前版本

- ✅ 增加健康检查超时到 30 秒
- ✅ 增加启动宽限期到 180 秒
- ✅ 增加重试次数到 5 次
- ✅ 使用 Node.js 内置 HTTP 模块替代 wget
- ✅ 健康检查端点增加超时控制
- ✅ 增加性能分级（healthy/degraded/unhealthy）
- ✅ 增强错误诊断和日志

### v1.0 (原始版本)

- 基础健康检查实现
- 使用 wget 工具
- 超时 10 秒，宽限期 90 秒，重试 3 次

---

## 📝 相关文档

- [Docker All-in-One 部署指南](./DOCKER_ALLINONE_DEPLOYMENT.md)
- [日志系统说明](./LOGGING.md)
- [故障排查指南](./DOCKER_DEPLOYMENT_TROUBLESHOOTING.md)
- [部署工作流优化](./DEPLOYMENT_WORKFLOW_OPTIMIZATION.md)

---

## 🤝 贡献

如果您在使用过程中发现健康检查相关的问题或有改进建议，欢迎：

1. 提交 Issue 描述问题
2. 提供详细的日志和环境信息
3. 建议改进方案

---

**最后更新**：2025-01-28  
**维护者**：HOMELABS Team

