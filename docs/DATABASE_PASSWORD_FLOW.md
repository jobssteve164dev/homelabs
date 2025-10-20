# 数据库密码配置流程说明

## 🔐 `POSTGRES_PASSWORD` 的作用

在部署工作流中，`POSTGRES_PASSWORD` 有**两个关键用途**：

### 1️⃣ PostgreSQL 数据库用户配置（服务器端）

**位置**: `.github/workflows/deploy-local.yml` 第 201-229 行

```yaml
DB_PASSWORD="${{ secrets.POSTGRES_PASSWORD }}"

sudo -u postgres psql <<'EOSQL'
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';  # ← 新建用户时设置密码
    ELSE
      ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';    # ← 更新现有用户的密码
    END IF;
  END
  \$\$;
EOSQL
```

**作用**:
- ✅ **全新安装**: 创建 PostgreSQL 用户并设置此密码
- ✅ **重复部署**: 更新现有用户的密码（确保密码同步）

### 2️⃣ 应用数据库连接配置（.env 文件）

**位置**: `.github/workflows/deploy-local.yml` 第 697 行

```yaml
DATABASE_URL=postgresql://${DB_USER}:${POSTGRES_PASSWORD}@localhost:5432/${DB_NAME}?schema=public
```

**作用**:
- ✅ Next.js 应用通过这个连接串连接到 PostgreSQL
- ✅ Prisma ORM 使用此 URL 进行数据库操作

---

## 🔄 完整的密码配置流程

### 全新安装环境（第一次部署）

```
1. GitHub Actions 读取 secrets.POSTGRES_PASSWORD
   ↓
2. 在服务器上创建 PostgreSQL 用户
   sudo -u postgres psql
   CREATE USER homelabs WITH PASSWORD '你的密码';
   ↓
3. 创建数据库并授权
   CREATE DATABASE homelabs_portal OWNER homelabs;
   GRANT ALL PRIVILEGES ON DATABASE homelabs_portal TO homelabs;
   ↓
4. 生成应用 .env 文件
   DATABASE_URL=postgresql://homelabs:你的密码@localhost:5432/homelabs_portal
   ↓
5. Prisma 使用 DATABASE_URL 初始化数据库结构
   npx prisma db push
   ↓
6. Next.js 应用连接数据库并正常运行 ✅
```

### 重复部署（已有环境）

```
1. GitHub Actions 读取 secrets.POSTGRES_PASSWORD
   ↓
2. 更新 PostgreSQL 用户密码（确保同步）
   ALTER USER homelabs WITH PASSWORD '你的密码';
   ↓
3. 更新应用 .env 文件中的 DATABASE_URL
   DATABASE_URL=postgresql://homelabs:你的密码@localhost:5432/homelabs_portal
   ↓
4. 重启应用，使用新的连接配置 ✅
```

---

## ✅ 为什么这样设计？

### 优势

1. **密码统一管理**
   - 只需在 GitHub Secrets 中配置一次
   - 服务器端和应用端自动同步

2. **支持密码更新**
   - 修改 GitHub Secret 后重新部署
   - 数据库用户密码和应用配置同步更新

3. **安全性**
   - 密码不出现在代码中
   - 不出现在 Git 历史中
   - 在 GitHub Actions 日志中被遮蔽为 `***`

4. **幂等性**
   - 多次执行同一配置不会出错
   - 已存在的用户会被更新密码而非报错

---

## 🔍 验证密码是否正确配置

### 方法一：检查工作流日志

```
✅ 在 GitHub Actions 日志中查找：
- "PostgreSQL数据库和用户配置完成"
- "✅ 环境配置文件已创建"
```

### 方法二：SSH 到服务器手动验证

```bash
# 1. SSH 登录服务器
ssh -p 22223 szlk@aiuni.szlk.site

# 2. 测试数据库连接（使用你配置的密码）
psql -U homelabs -d homelabs_portal -h localhost

# 如果成功连接，说明密码配置正确 ✅
```

### 方法三：检查应用 .env 文件

```bash
# 在服务器上查看（密码会显示）
cat /opt/homelabs/.env | grep DATABASE_URL

# 应该显示类似：
# DATABASE_URL=postgresql://homelabs:bD3tddNaIQ/tOSuwbTIiwZecKVR21gHh@localhost:5432/homelabs_portal?schema=public
```

---

## ⚠️ 常见问题

### Q1: 首次部署时，PostgreSQL 还没安装，密码怎么配置？

**A**: 工作流会**自动安装 PostgreSQL**，然后再配置用户和密码：

```yaml
# 步骤 1: 检测并安装 PostgreSQL
if ! command -v psql &> /dev/null; then
  echo "正在安装 PostgreSQL..."
  sudo apt install -y postgresql postgresql-contrib
fi

# 步骤 2: 启动 PostgreSQL 服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 步骤 3: 配置数据库用户和密码
sudo -u postgres psql -c "CREATE USER ..."
```

### Q2: 如果我想修改数据库密码怎么办？

**A**: 只需更新 GitHub Secret，然后重新部署：

```bash
# 生成新密码
NEW_PASSWORD=$(openssl rand -base64 24)

# 更新 GitHub Secret
gh secret set POSTGRES_PASSWORD -b "$NEW_PASSWORD"

# 重新部署（会自动同步密码）
gh workflow run deploy-local.yml -f deploy_mode=all
```

### Q3: 密码配置错误会怎么样？

**A**: 应用无法连接数据库，表现为：

```
❌ Prisma 错误: Authentication failed for user 'homelabs'
❌ Next.js 启动失败
```

**解决方案**: 确保 GitHub Secret 中的密码正确，重新部署。

---

## 📋 配置检查清单

在触发部署前，确保：

- [ ] ✅ `POSTGRES_PASSWORD` 已配置到 GitHub Secrets
- [ ] ✅ 密码长度至少 16 字符（安全性）
- [ ] ✅ 密码已保存到安全位置（备份）
- [ ] ✅ 没有将密码提交到 Git 仓库

---

## 🎯 总结

| 变量 | 用途 | 配置位置 | 是否必需 |
|------|------|---------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL 用户密码 | GitHub Secrets | ✅ 必需 |
| `POSTGRES_USER` | PostgreSQL 用户名 | GitHub Variables | 可选（默认: homelabs） |
| `POSTGRES_DB` | 数据库名称 | GitHub Variables | 可选（默认: homelabs_portal） |

**核心要点**:
- ✅ `POSTGRES_PASSWORD` 在全新安装时会被用来配置数据库用户密码
- ✅ 同时也会被写入应用的 `.env` 文件供 Prisma 连接使用
- ✅ 重复部署时会自动同步密码，确保一致性
- ✅ 整个过程完全自动化，无需手动干预

**你的密码**: `bD3tddNaIQ/tOSuwbTIiwZecKVR21gHh` 在部署时会被正确配置到数据库和应用中！✅



