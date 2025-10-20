# 📋 日志清理机制详解

## 概述

HOMELABS Portal 采用多层日志管理策略，包括**自动轮转**和**部署时清理**两种机制。

## 🔄 日志清理机制

### 1. Winston 自动日志轮转（主要机制）

#### 配置位置
`client/src/lib/logger.ts`

#### 自动轮转策略

| 日志类型 | 文件名模式 | 保留时间 | 单文件大小限制 | 自动清理 |
|---------|-----------|---------|--------------|---------|
| **错误日志** | `error-YYYY-MM-DD.log` | 30天 | 20MB | ✅ 是 |
| **综合日志** | `combined-YYYY-MM-DD.log` | 30天 | 20MB | ✅ 是 |
| **异常日志** | `exceptions-YYYY-MM-DD.log` | 30天 | 20MB | ✅ 是 |
| **拒绝日志** | `rejections-YYYY-MM-DD.log` | 30天 | 20MB | ✅ 是 |

#### 工作原理

```typescript
new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',        // 每天创建新文件
  maxFiles: '30d',                   // 自动删除30天前的日志
  maxSize: '20m',                    // 单文件最大20MB
  format: logFormat,
})
```

**特点：**
- ✅ **自动按日期切分**：每天自动创建新文件
- ✅ **自动删除旧文件**：超过30天的日志自动删除
- ✅ **大小限制**：单个日志文件达到20MB时自动轮转
- ✅ **无需人工干预**：完全自动化

**示例：**
```
logs/
├── error-2025-10-01.log      # 20天前，保留
├── error-2025-10-10.log      # 10天前，保留
├── error-2025-10-20.log      # 今天，正在写入
├── error-2025-09-15.log      # 35天前，自动删除 ❌
└── combined-2025-10-20.log   # 今天，正在写入
```

### 2. PM2 日志清理（部署时清理）

#### 配置位置
`template/deploy-local.yml` 第1713-1737行

#### 清理时机
**仅在部署时执行**（当选择 `all` 或 `backend` 部署模式时）

#### 清理策略

```bash
# 1. 清空PM2内部日志缓冲
pm2 flush

# 2. 备份当前日志（保留最近一次）
mv logs/planovai-combined.log logs/planovai-combined.log.old
mv logs/planovai-error.log logs/planovai-error.log.old

# 3. 删除更早的备份
rm -f logs/*.log.old.*
```

**特点：**
- 🔄 **仅部署时执行**：不影响运行中的日志
- 📦 **保留一次备份**：可回溯上一次部署的日志
- 🗑️ **删除更早备份**：避免备份堆积

## 📊 完整日志清理时间线

### 日常运行（无部署）

```
第1天   ← Winston创建: error-2025-10-01.log
第2天   ← Winston创建: error-2025-10-02.log
...
第30天  ← Winston创建: error-2025-10-30.log
第31天  ← Winston删除: error-2025-10-01.log ✅ (超过30天)
        ← Winston创建: error-2025-10-31.log
```

### 部署时清理

```
部署前:
├── PM2日志 (planovai-combined.log)      ← 未清理，持续写入
├── Winston日志 (error-2025-10-20.log)   ← 未清理，持续写入
└── 旧备份 (*.log.old.*)                ← 删除 ✅

部署中:
1. pm2 flush                            ← 清空PM2缓冲
2. 备份: planovai-combined.log → .old   ← 保留一次备份
3. 删除: 所有 *.log.old.*              ← 清理旧备份

部署后:
├── planovai-combined.log.old           ← 上次部署的备份
├── planovai-combined.log               ← 新的日志文件
└── Winston日志继续自动轮转             ← 不受影响
```

## 🎯 不同日志类型的清理策略对比

| 日志类型 | 清理机制 | 清理频率 | 保留时长 | 部署时影响 |
|---------|---------|---------|---------|-----------|
| **Winston应用日志** | 自动轮转 | 持续 | 30天 | ❌ 不受影响 |
| **PM2进程日志** | 部署时清理 | 每次部署 | 保留1次备份 | ✅ 备份后清空 |
| **Nginx访问日志** | 系统logrotate | 每天 | 14天（默认） | ❌ 不受影响 |
| **Nginx错误日志** | 系统logrotate | 每天 | 14天（默认） | ❌ 不受影响 |

## 💡 最佳实践建议

### 1. 定期检查磁盘空间

```bash
# 检查日志目录大小
du -sh /opt/homelabs/logs

# 检查最大的日志文件
du -h /opt/homelabs/logs/* | sort -hr | head -10
```

### 2. 手动清理（紧急情况）

**⚠️ 仅在磁盘空间紧急时使用**

```bash
# 删除30天前的Winston日志
find /opt/homelabs/logs -name "*.log" -mtime +30 -delete

# 清空PM2日志（不推荐，会丢失历史）
pm2 flush

# 删除所有旧备份
rm -f /opt/homelabs/logs/*.log.old*
```

### 3. 监控日志大小

**设置告警阈值：**
- 单个日志文件 > 50MB → 警告
- 日志目录总大小 > 1GB → 警告
- 磁盘使用率 > 80% → 严重告警

### 4. 调整保留策略（如需）

**如果磁盘空间有限，可以缩短保留时间：**

编辑 `client/src/lib/logger.ts`:
```typescript
maxFiles: '14d',  // 从30天改为14天
maxSize: '10m',   // 从20MB改为10MB
```

**如果需要更长保留时间：**
```typescript
maxFiles: '90d',  // 保留90天
```

## 📈 日志空间估算

**典型使用场景（中等流量）：**

| 日志类型 | 日增长 | 30天总计 | 说明 |
|---------|--------|---------|------|
| error.log | 1-5MB | 30-150MB | 错误日志 |
| combined.log | 10-50MB | 300MB-1.5GB | 所有级别日志 |
| exceptions.log | 0-1MB | 0-30MB | 异常日志 |
| rejections.log | 0-1MB | 0-30MB | Promise拒绝 |
| **总计** | **11-57MB/天** | **330MB-1.7GB** | 30天总计 |

**高流量场景：**
- 可能达到 **5GB+** (30天)
- 建议使用外部日志服务（如ELK、Loki）

## 🔧 故障排查

### Q1: 日志文件一直在增长，没有轮转？

**原因：** `winston-daily-rotate-file` 未正确安装

**解决：**
```bash
cd client
npm install winston-daily-rotate-file
npm run build
pm2 restart homelabs-portal
```

### Q2: 旧日志没有被自动删除？

**检查：**
```bash
# 查看Winston配置
cd /opt/homelabs/client
grep -A 5 "maxFiles" src/lib/logger.ts

# 检查日志文件时间戳
ls -lth ../logs/*.log | head -10
```

**可能原因：**
- `maxFiles` 设置错误
- 文件权限问题
- 磁盘空间不足导致删除失败

### Q3: 部署后日志丢失？

**原因：** PM2日志在部署时被清理，但Winston日志不受影响

**查看备份：**
```bash
cat /opt/homelabs/logs/planovai-combined.log.old
```

**恢复日志：**
```bash
cp /opt/homelabs/logs/planovai-combined.log.old \
   /opt/homelabs/logs/backup-$(date +%Y%m%d).log
```

## 📝 总结

### ✅ 现有机制

1. **Winston自动轮转**：30天，20MB，完全自动化 ✅
2. **PM2部署清理**：保留1次备份，清理旧备份 ✅
3. **空间保护**：大小和时间双重限制 ✅

### 🎯 回答原问题

**"每次部署时会清理旧的日志吗？"**

**答案：** 
- **PM2日志**：是的，会备份一次后清空 ✅
- **Winston日志**：**不会**，由自动轮转机制管理（30天自动删除）❌
- **最佳实践**：Winston日志的自动轮转已经足够，无需部署时清理

### 💡 建议

当前的日志管理策略是**合理且专业**的：
- ✅ 自动化程度高
- ✅ 保留时间适中（30天）
- ✅ 不影响生产运行
- ✅ 有备份机制

**无需额外配置，除非：**
- 磁盘空间特别紧张 → 缩短保留时间
- 审计要求更长保留 → 增加保留时间或接入外部日志系统

