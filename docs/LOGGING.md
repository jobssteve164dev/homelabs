# HOMELABS Portal 日志管理文档

## 📊 日志架构概览

HOMELABS Portal 采用**多层级、统一收集**的日志架构，所有日志文件集中存储在 `/opt/homelabs/logs/` 目录（生产环境）或项目根目录的 `logs/` （开发环境）。

```
/opt/homelabs/logs/
├── 📝 应用层日志 (Winston)
│   ├── combined-YYYY-MM-DD.log      # 所有级别的应用日志（统一日志）
│   ├── error-YYYY-MM-DD.log         # 错误级别日志
│   ├── exceptions-YYYY-MM-DD.log    # 未捕获的异常
│   └── rejections-YYYY-MM-DD.log    # 未处理的Promise拒绝
│
├── 🔄 进程管理日志 (PM2)
│   ├── pm2-combined.log             # PM2进程输出（包含启动/重启等元数据）
│   └── pm2-error.log                # PM2进程错误
│
└── 🌐 Web服务器日志 (Nginx)
    ├── nginx-access.log             # HTTP访问日志
    └── nginx-error.log              # Nginx错误日志
```

---

## 🎯 日志分层说明

### 1️⃣ **应用层日志 (Winston)** - 主要日志来源

**统一日志文件**: `combined-YYYY-MM-DD.log`

这是**最重要的日志文件**，记录所有应用级事件：
- ✅ API请求/响应
- ✅ 数据库操作
- ✅ 业务逻辑执行
- ✅ 用户行为（登录、操作等）
- ✅ 性能指标
- ✅ 安全事件

**日志格式**: 结构化JSON
```json
{
  "timestamp": "2025-10-20 14:30:45",
  "level": "info",
  "message": "API Request",
  "method": "GET",
  "path": "/api/projects",
  "userId": "user123",
  "ip": "192.168.1.100",
  "statusCode": 200,
  "duration": "45ms",
  "service": "homelabs-portal",
  "environment": "production"
}
```

**日志级别**:
- `error`: 错误事件（同时写入 `error-YYYY-MM-DD.log`）
- `warn`: 警告信息（如API慢查询、限流触发）
- `info`: 一般信息（API请求、用户操作）
- `debug`: 调试信息（仅开发环境）

**自动轮转配置**:
- 按日期分割（每天一个文件）
- 保留30天历史
- 单文件最大20MB（超出自动分割）

**敏感信息保护**:
- 自动过滤 `password`, `secret`, `token`, `key` 等字段
- 替换为 `***REDACTED***`

---

### 2️⃣ **进程管理日志 (PM2)** - 进程元数据

**用途**: PM2进程管理器的元数据日志

**包含内容**:
- 进程启动/重启/停止事件
- 内存/CPU使用情况（如果开启监控）
- 进程崩溃信息

**注意**: 
- 应用业务日志**不在这里**，而在Winston的 `combined-*.log`
- 主要用于诊断进程管理问题

---

### 3️⃣ **Web服务器日志 (Nginx)** - HTTP层

**访问日志** (`nginx-access.log`):
```
192.168.1.100 - - [20/Oct/2025:14:30:45 +0800] "GET /api/projects HTTP/1.1" 200 1234 "-" "Mozilla/5.0..."
```

**用途**:
- HTTP请求统计
- 流量分析
- 客户端IP追踪
- 性能分析（响应时间）

**错误日志** (`nginx-error.log`):
- Nginx配置错误
- 上游服务器连接失败
- 限流/防护触发

---

## 🔍 日常日志查看命令

### 实时监控（生产环境推荐）

```bash
# 1. 监控所有应用日志（最常用）
tail -f /opt/homelabs/logs/combined-*.log | jq '.'

# 2. 只看错误日志
tail -f /opt/homelabs/logs/error-*.log | jq '.'

# 3. 监控特定用户的操作
tail -f /opt/homelabs/logs/combined-*.log | jq 'select(.userId == "user123")'

# 4. 监控慢请求（超过100ms）
tail -f /opt/homelabs/logs/combined-*.log | jq 'select(.duration > "100ms")'

# 5. 查看PM2进程状态
pm2 logs homelabs-portal --lines 50

# 6. 监控Nginx访问
tail -f /opt/homelabs/logs/nginx-access.log
```

### 历史日志查询

```bash
# 查看昨天的错误日志
cat /opt/homelabs/logs/error-2025-10-19.log | jq '.'

# 统计今天的API调用次数
grep "API Request" /opt/homelabs/logs/combined-$(date +%Y-%m-%d).log | wc -l

# 查找特定错误
grep "Database connection failed" /opt/homelabs/logs/error-*.log

# 查看最近100条日志
tail -n 100 /opt/homelabs/logs/combined-*.log | jq '.'
```

### 按级别过滤

```bash
# 只看error级别
cat /opt/homelabs/logs/combined-*.log | jq 'select(.level == "error")'

# 只看warn和error
cat /opt/homelabs/logs/combined-*.log | jq 'select(.level == "warn" or .level == "error")'
```

---

## 🚨 故障排查指南

### 场景1: 应用无响应/崩溃

```bash
# 1. 检查PM2进程状态
pm2 status

# 2. 查看最近的错误日志
tail -n 100 /opt/homelabs/logs/error-*.log | jq '.'

# 3. 查看未捕获异常
tail -n 50 /opt/homelabs/logs/exceptions-*.log | jq '.'

# 4. 查看PM2进程日志
pm2 logs homelabs-portal --lines 100 --err
```

### 场景2: API响应慢

```bash
# 1. 统计慢请求（>500ms）
cat /opt/homelabs/logs/combined-*.log | \
  jq 'select(.duration != null) | select((.duration | gsub("ms";"") | tonumber) > 500)'

# 2. 按端点分组统计平均响应时间
cat /opt/homelabs/logs/combined-*.log | \
  jq -r 'select(.path != null) | "\(.path) \(.duration)"' | \
  awk '{sum[$1]+=$2; count[$1]++} END {for(path in sum) print path, sum[path]/count[path] "ms"}'
```

### 场景3: 数据库连接问题

```bash
# 搜索数据库相关错误
grep -i "database\|prisma\|postgres" /opt/homelabs/logs/error-*.log | tail -n 50

# 检查连接超时
grep "connection timeout" /opt/homelabs/logs/error-*.log
```

### 场景4: 认证/授权问题

```bash
# 查看安全事件
cat /opt/homelabs/logs/combined-*.log | jq 'select(.message == "Security Event")'

# 查看失败的登录尝试
cat /opt/homelabs/logs/combined-*.log | jq 'select(.message == "API Request" and .path == "/api/auth/signin" and .statusCode >= 400)'
```

---

## 📈 日志分析脚本

### 每日报告生成

```bash
#!/bin/bash
# 生成每日日志报告

DATE=$(date +%Y-%m-%d)
LOGFILE="/opt/homelabs/logs/combined-${DATE}.log"

echo "=== HOMELABS Portal 每日日志报告 ==="
echo "日期: $DATE"
echo ""

echo "📊 请求统计:"
echo "总请求数: $(grep '"message":"API Request"' $LOGFILE | wc -l)"
echo "成功(2xx): $(grep '"statusCode":2' $LOGFILE | wc -l)"
echo "错误(4xx): $(grep '"statusCode":4' $LOGFILE | wc -l)"
echo "错误(5xx): $(grep '"statusCode":5' $LOGFILE | wc -l)"
echo ""

echo "⚠️  错误摘要:"
cat /opt/homelabs/logs/error-${DATE}.log | jq -r '.message' | sort | uniq -c | sort -rn | head -10
echo ""

echo "🐌 慢请求Top 10:"
cat $LOGFILE | jq 'select(.duration != null) | {path, duration}' | \
  jq -s 'sort_by(.duration | gsub("ms";"") | tonumber) | reverse | .[0:10]'
```

### 实时监控脚本

```bash
#!/bin/bash
# 实时监控关键指标

tail -f /opt/homelabs/logs/combined-*.log | while read line; do
  # 提取关键信息
  LEVEL=$(echo $line | jq -r '.level')
  MESSAGE=$(echo $line | jq -r '.message')
  
  # 错误告警
  if [ "$LEVEL" = "error" ]; then
    echo "🚨 错误: $MESSAGE"
    # 这里可以接入告警系统（邮件、钉钉、微信等）
  fi
  
  # 慢请求告警
  DURATION=$(echo $line | jq -r '.duration // "" | gsub("ms";"") | tonumber // 0')
  if [ "$DURATION" -gt 1000 ]; then
    echo "⚠️  慢请求: $(echo $line | jq -r '.path') - ${DURATION}ms"
  fi
done
```

---

## 🔧 日志配置调整

### 修改日志级别

**生产环境** (修改 `.env` 文件):
```env
LOG_LEVEL=info   # 可选: debug, info, warn, error
```

**开发环境**:
```bash
LOG_LEVEL=debug npm run dev
```

### 修改日志保留策略

编辑 `client/src/lib/logger.ts`:

```typescript
// 修改保留天数
maxFiles: '30d',  // 改为 '60d' 保留60天

// 修改单文件大小
maxSize: '20m',   // 改为 '50m' 单文件最大50MB
```

### 禁用某些日志（不推荐）

如果某些日志过于频繁，可以在代码中过滤：

```typescript
// 示例：不记录健康检查请求
if (path === '/api/health') {
  return;  // 不记录
}
logApiRequest(method, path, userId, ip, statusCode, duration);
```

---

## 💾 日志备份与归档

### 自动备份脚本

```bash
#!/bin/bash
# 每周备份日志到远程存储

BACKUP_DIR="/backup/homelabs-logs"
LOGS_DIR="/opt/homelabs/logs"
DATE=$(date +%Y%m%d)

# 压缩上周的日志
tar -czf "${BACKUP_DIR}/logs-${DATE}.tar.gz" \
  ${LOGS_DIR}/*.log \
  --exclude="${LOGS_DIR}/combined-$(date +%Y-%m-%d).log"

# 上传到云存储（根据实际情况选择）
# aws s3 cp "${BACKUP_DIR}/logs-${DATE}.tar.gz" s3://my-bucket/logs/
# rclone copy "${BACKUP_DIR}/logs-${DATE}.tar.gz" remote:logs/

# 清理30天前的本地备份
find ${BACKUP_DIR} -name "logs-*.tar.gz" -mtime +30 -delete

echo "✅ 日志备份完成: logs-${DATE}.tar.gz"
```

**添加到crontab**:
```bash
# 每周日凌晨3点执行备份
0 3 * * 0 /opt/homelabs/scripts/backup-logs.sh
```

---

## 🚀 最佳实践

### ✅ 推荐做法

1. **使用 `tail -f` 实时监控**，配合 `jq` 格式化JSON
2. **定期检查错误日志**，设置告警阈值
3. **保存重要的日志快照**（发版前后、故障时刻）
4. **使用日志分析工具**（如ELK、Loki等）进行深度分析
5. **定期清理旧日志**，避免磁盘满

### ❌ 避免做法

1. **不要在生产环境使用 `debug` 级别**（日志量过大）
2. **不要手动删除当天的日志文件**（可能正在写入）
3. **不要在日志中记录完整的密码、密钥**（已自动过滤）
4. **不要忽略 `exceptions.log` 和 `rejections.log`**（关键错误）

---

## 📚 相关资源

- [Winston文档](https://github.com/winstonjs/winston)
- [PM2日志管理](https://pm2.keymetrics.io/docs/usage/log-management/)
- [Nginx日志分析](https://nginx.org/en/docs/http/ngx_http_log_module.html)
- [jq JSON处理器](https://stedolan.github.io/jq/)

---

**最后更新**: 2025-10-20  
**维护者**: AI Assistant

