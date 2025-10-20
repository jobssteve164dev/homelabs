# 系统维护 API 文档

## 概述

系统维护API提供了三个核心功能：清理缓存、数据备份和系统重启。所有操作都需要管理员权限。

## API 端点

**POST** `/api/admin/maintenance`

### 认证要求

- 需要登录且具有 `ADMIN` 角色
- 使用 NextAuth session 验证

### 请求格式

```json
{
  "action": "clear-cache" | "backup" | "restart"
}
```

## 功能详解

### 1. 清理缓存 (clear-cache)

清理 Next.js 构建缓存，释放磁盘空间。

**请求示例：**
```json
{
  "action": "clear-cache"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "缓存清理成功",
  "timestamp": "2025-10-19T12:00:00.000Z"
}
```

**操作内容：**
- 删除 `.next/cache` 目录
- 重新创建空的缓存目录
- 不影响应用运行

**适用场景：**
- 构建缓存损坏
- 磁盘空间不足
- 定期维护

---

### 2. 数据备份 (backup)

创建完整的数据库备份。

**请求示例：**
```json
{
  "action": "backup"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "数据备份成功",
  "backupFile": "backup-2025-10-19T12-00-00-000Z.sql",
  "timestamp": "2025-10-19T12:00:00.000Z"
}
```

**操作内容：**
- 使用 `pg_dump` 创建 PostgreSQL 备份（优先）
- 如果 `pg_dump` 不可用，使用 Prisma 导出 JSON 格式
- 自动保留最近 10 个备份文件
- 备份保存在 `backups/` 目录

**备份策略：**
- **主要方式**: PostgreSQL 二进制格式 (`.sql`)
- **备用方式**: JSON 格式 (`.json`)
- **自动清理**: 超过 10 个备份时删除旧文件
- **命名格式**: `backup-{ISO时间戳}.sql`

**适用场景：**
- 重大更新前
- 定期数据保护
- 系统迁移前

---

### 3. 系统重启 (restart)

重启应用服务。

**请求示例：**
```json
{
  "action": "restart"
}
```

**开发环境响应：**
```json
{
  "success": true,
  "message": "开发环境：系统重启请求已记录",
  "note": "在开发环境中，请手动重启服务器",
  "timestamp": "2025-10-19T12:00:00.000Z"
}
```

**生产环境响应：**
```json
{
  "success": true,
  "message": "系统重启指令已发送，服务将在3秒后重启",
  "timestamp": "2025-10-19T12:00:00.000Z"
}
```

**操作内容：**
- **开发环境**: 仅记录日志，需要手动重启
- **生产环境**: 3秒后执行 `process.exit(0)`，由进程管理器自动重启

**注意事项：**
- ⚠️ 会导致服务短暂中断
- ⚠️ 所有在线用户会暂时断开连接
- 📅 建议在低峰时段执行
- 🔄 依赖进程管理器（如 PM2）自动重启

**适用场景：**
- 应用配置更新后
- 内存泄漏问题
- 紧急故障恢复

---

## 错误处理

### 权限错误 (403)
```json
{
  "error": "权限不足"
}
```

### 无效操作 (400)
```json
{
  "error": "无效的操作类型"
}
```

### 服务器错误 (500)
```json
{
  "error": "操作失败",
  "details": "具体错误信息"
}
```

---

## 安全注意事项

1. **权限控制**: 所有操作都需要 ADMIN 权限
2. **操作确认**: 前端必须实现二次确认机制
3. **日志记录**: 所有操作都会记录到服务器日志
4. **备份安全**: 备份文件包含敏感数据，存储位置应受保护
5. **重启风险**: 系统重启会影响所有用户，应谨慎使用

---

## 使用示例

### 前端调用示例

```typescript
// 清理缓存
const clearCache = async () => {
  const response = await fetch('/api/admin/maintenance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clear-cache' })
  });
  const data = await response.json();
  console.log(data.message);
};

// 备份数据
const backupData = async () => {
  const response = await fetch('/api/admin/maintenance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'backup' })
  });
  const data = await response.json();
  console.log(`备份文件: ${data.backupFile}`);
};

// 系统重启
const restartSystem = async () => {
  const response = await fetch('/api/admin/maintenance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'restart' })
  });
  const data = await response.json();
  console.log(data.message);
};
```

---

## 环境配置

### 数据库备份配置

需要确保 `DATABASE_URL` 环境变量已正确配置：

```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 生产环境进程管理

使用 PM2 或类似工具管理进程，确保自动重启功能：

```bash
# PM2 配置示例
pm2 start npm --name "homelabs" -- start
pm2 startup
pm2 save
```

---

## 维护建议

1. **定期备份**: 建议每天执行一次数据备份
2. **清理缓存**: 构建问题时首先尝试清理缓存
3. **谨慎重启**: 重启前确认没有重要操作正在进行
4. **监控日志**: 关注维护操作的日志输出
5. **备份保留**: 根据实际需求调整备份保留数量

---

## 故障排查

### 备份失败
- 检查 `DATABASE_URL` 配置
- 确认数据库连接正常
- 验证文件系统写入权限
- 查看 `pg_dump` 是否安装

### 重启失败
- 检查进程管理器配置
- 验证应用进程状态
- 查看系统日志

### 权限错误
- 确认用户已登录
- 验证用户角色为 ADMIN
- 检查 session 状态

