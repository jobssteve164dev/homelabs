# Docker容器中Prisma CLI不可用问题修复

## 问题描述

在生产服务器容器部署后，日志中出现以下错误：
```
sh: prisma: not found
```

导致数据库初始化失败，虽然应用能够启动，但无法执行数据库迁移和初始化操作。

## 根本原因分析

1. **Next.js Standalone模式限制**：
   - 项目使用`output: "standalone"`模式，Next.js只打包运行时必需的依赖
   - Prisma CLI作为开发/迁移工具，不在运行时依赖中，因此未被包含在standalone输出中

2. **Dockerfile复制不完整**：
   - 虽然复制了`node_modules/prisma`目录，但可能缺少必要的可执行文件或依赖
   - `node_modules/.bin/prisma`可能未被正确复制（可能是符号链接问题）

3. **启动脚本检测逻辑问题**：
   - `docker-entrypoint.sh`优先使用`npx prisma`，但在容器中`npx`可能不可用
   - 未优先使用最可靠的Prisma入口文件路径

## 解决方案

### 1. 修改Dockerfile (`docker/Dockerfile`)

确保复制Prisma CLI可执行文件：
```dockerfile
# 复制Prisma CLI可执行文件
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
```

### 2. 优化启动脚本 (`docker/docker-entrypoint.sh`)

修改Prisma命令检测逻辑，优先使用最可靠的方法：
- **第一优先级**：直接使用`node node_modules/prisma/build/index.js`（最可靠）
- **第二优先级**：使用`node_modules/.bin/prisma`（如果存在）
- **第三优先级**：使用`npx prisma`（如果npx可用）

添加详细的调试信息，便于问题诊断。

## 修复内容

### 文件修改清单

1. **docker/Dockerfile**
   - 添加了`node_modules/.bin/prisma`的复制步骤

2. **docker/docker-entrypoint.sh**
   - 优化了Prisma命令检测逻辑
   - 优先使用`node_modules/prisma/build/index.js`
   - 添加了详细的调试信息输出

## 验证步骤

1. **重新构建Docker镜像**：
   ```bash
   cd docker
   docker-compose build app
   ```

2. **启动容器并检查日志**：
   ```bash
   docker-compose up app
   ```

3. **验证Prisma CLI可用性**：
   - 查看日志中是否出现"✅ 使用Prisma CLI"消息
   - 确认数据库初始化成功完成

4. **检查数据库连接**：
   - 确认应用能够正常连接数据库
   - 验证数据库迁移是否成功执行

## 预期结果

修复后，容器启动日志应该显示：
```
🚀 启动应用容器...
✅ 使用Prisma CLI: node_modules/prisma/build/index.js
⏳ 等待数据库连接并初始化...
✅ 数据库已就绪并初始化完成
🚀 启动Next.js应用...
```

## 相关文件

- `docker/Dockerfile` - Docker镜像构建配置
- `docker/docker-entrypoint.sh` - 容器启动脚本
- `client/next.config.ts` - Next.js配置（standalone模式）
- `client/package.json` - 项目依赖配置

## 注意事项

1. **Prisma版本兼容性**：确保Prisma版本与项目依赖一致
2. **数据库连接**：确保`DATABASE_URL`环境变量正确配置
3. **网络连接**：确保容器能够访问数据库服务（在同一Docker网络中）

## 后续优化建议

1. 考虑使用Prisma Migrate进行数据库迁移管理
2. 在CI/CD流程中单独执行数据库迁移，而不是在容器启动时执行
3. 添加健康检查，确保数据库连接正常后再启动应用

