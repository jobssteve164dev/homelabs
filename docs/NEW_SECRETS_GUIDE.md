# 🔐 生产环境密钥更新指南

## 问题说明

原数据库密码 `bD3tduNaIQ/tOSuwbTIiwZecKVR21gHh` 包含特殊字符 `/`，在PostgreSQL连接字符串中被误解析为分隔符，导致"invalid port number"错误。

## 新生成的密钥

### 1. POSTGRES_PASSWORD（数据库密码）- 推荐使用

**选项A（纯字母数字，避免特殊字符）：**
```
8h5WIpYDnVpA6JwiAs139AC7QTr7Jb6Z
```

**选项B（Base64编码，如使用需要URL编码）：**
```
E+uLRGlmceFneKVXN4sqTFouA0x73TSe2HfowXbSdTg=
```

**选项C（Base64编码，如使用需要URL编码）：**
```
tn5nWIvIwT3+4KzDkiHFycGRnHVsOM0U0UrnN44Yq8o=
```

### 2. NEXTAUTH_SECRET（认证密钥）

如果需要同时更新NEXTAUTH_SECRET，使用以下任意一个：
```
E+uLRGlmceFneKVXN4sqTFouA0x73TSe2HfowXbSdTg=
tn5nWIvIwT3+4KzDkiHFycGRnHVsOM0U0UrnN44Yq8o=
```

## 💡 强烈推荐

**使用选项A：`8h5WIpYDnVpA6JwiAs139AC7QTr7Jb6Z`**

理由：
- ✅ 纯字母数字，无需URL编码
- ✅ 32位长度，安全性足够
- ✅ 避免PostgreSQL连接字符串解析问题
- ✅ 兼容性最好

## 📋 GitHub Secrets 更新步骤

### 1. 更新 POSTGRES_PASSWORD

1. 进入 GitHub 仓库
2. 点击 `Settings` > `Secrets and variables` > `Actions` > `Secrets` 标签页
3. 找到 `POSTGRES_PASSWORD`
4. 点击右侧的铅笔图标（编辑）
5. 将值更新为：**`8h5WIpYDnVpA6JwiAs139AC7QTr7Jb6Z`**
6. 点击 `Update secret`

### 2. 更新服务器上的数据库密码

SSH登录到服务器后执行：

```bash
# 连接到PostgreSQL
sudo -u postgres psql

# 更新homelabs用户密码
ALTER USER homelabs WITH PASSWORD '8h5WIpYDnVpA6JwiAs139AC7QTr7Jb6Z';

# 退出
\q
```

### 3. 重新部署应用

更新完GitHub Secrets后：

1. 进入 GitHub 仓库的 `Actions` 标签页
2. 选择 `本地环境部署（非Docker）` 工作流
3. 点击 `Run workflow`
4. 选择 `all` (完整部署)
5. 点击 `Run workflow` 确认

## 🔍 验证步骤

部署完成后，SSH到服务器验证：

```bash
# 检查环境变量文件
cat /opt/homelabs/.env | grep DATABASE_URL

# 应该看到类似这样的输出（密码部分应该是新密码）：
# DATABASE_URL=postgresql://homelabs:8h5WIpYDnVpA6JwiAs139AC7QTr7Jb6Z@localhost:5432/homelabs_portal?schema=public

# 测试数据库连接
psql "postgresql://homelabs:8h5WIpYDnVpA6JwiAs139AC7QTr7Jb6Z@localhost:5432/homelabs_portal" -c "SELECT 1;"

# 重启应用
pm2 restart homelabs-portal

# 检查应用日志
pm2 logs homelabs-portal --lines 20

# 测试健康检查
curl http://localhost:3001/api/health
```

## ⚠️ 如果Base64密钥包含特殊字符

如果你选择使用Base64编码的密钥（选项B或C），需要进行URL编码：

| 原字符 | URL编码 |
|--------|---------|
| `+`    | `%2B`   |
| `/`    | `%2F`   |
| `=`    | `%3D`   |

例如，如果使用 `E+uLRGlmceFneKVXN4sqTFouA0x73TSe2HfowXbSdTg=`，
DATABASE_URL应该写成：
```
postgresql://homelabs:E%2BuLRGlmceFneKVXN4sqTFouA0x73TSe2HfowXbSdTg%3D@localhost:5432/homelabs_portal?schema=public
```

但这样很容易出错，**强烈建议使用选项A**！

## 📊 对比说明

| 密钥选项 | 优点 | 缺点 | 推荐度 |
|----------|------|------|--------|
| 选项A（纯字母数字） | 无需编码，兼容性好 | 字符集较小 | ⭐⭐⭐⭐⭐ |
| 选项B/C（Base64） | 熵值更高 | 需要URL编码 | ⭐⭐⭐ |

## 🎯 最终建议

1. **POSTGRES_PASSWORD**: 使用 `8h5WIpYDnVpA6JwiAs139AC7QTr7Jb6Z`
2. **NEXTAUTH_SECRET**: 保持现有或使用 `E+uLRGlmceFneKVXN4sqTFouA0x73TSe2HfowXbSdTg=`（不需要URL编码）

NEXTAUTH_SECRET不在连接字符串中使用，所以可以包含特殊字符。



