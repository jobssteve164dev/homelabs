# 管理员提升指南

## 📋 概述

本文档说明如何在HOMELABS Portal中将用户提升为管理员，包括本地开发和Docker部署环境。

---

## 🐳 Docker All-in-One 部署环境

### 方法一：使用包装脚本（推荐）

部署后使用自动处理环境变量的包装脚本：

```bash
# 进入容器
docker compose exec app sh

# 使用包装脚本（自动处理DATABASE_URL）
./scripts/promote-admin-docker.sh admin@example.com
```

### 方法二：手动设置环境变量

```bash
# 进入容器
docker compose exec app sh

# 设置环境变量
export DATABASE_URL="postgresql://${POSTGRES_USER:-homelabs}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB:-homelabs_portal}?schema=public"

# 运行脚本
npx tsx /app/scripts/promote-admin.ts admin@example.com
```

### 方法三：使用SQL直接操作（最快）

```bash
# 无需进入容器，直接执行
docker compose exec app su-exec postgres psql -d homelabs_portal -c "UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';"

# 验证结果
docker compose exec app su-exec postgres psql -d homelabs_portal -c "SELECT email, name, role FROM users WHERE email = 'admin@example.com';"
```

### 方法四：交互式SQL操作

```bash
# 进入PostgreSQL客户端
docker compose exec app su-exec postgres psql -d homelabs_portal

# 在psql提示符下：

-- 1. 查看所有用户
SELECT email, name, role, "isActive" FROM users;

-- 2. 提升指定用户为管理员
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';

-- 3. 验证结果
SELECT email, name, role FROM users WHERE role = 'ADMIN';

-- 4. 退出
\q
```

---

## 💻 本地开发环境

### 使用TypeScript脚本

```bash
# 在client目录下
cd client

# 交互式输入邮箱
npx tsx scripts/promote-admin.ts

# 或直接指定邮箱
npx tsx scripts/promote-admin.ts admin@example.com
```

### 使用Prisma Studio（可视化）

```bash
# 启动Prisma Studio
cd client
npx prisma studio

# 在浏览器中：
# 1. 打开 http://localhost:5555
# 2. 选择 User 模型
# 3. 找到目标用户
# 4. 将 role 字段改为 ADMIN
# 5. 保存
```

---

## 🔍 验证管理员权限

### 通过数据库查询验证

```bash
# Docker环境
docker compose exec app su-exec postgres psql -d homelabs_portal -c \
  "SELECT email, name, role, \"isActive\" FROM users WHERE role = 'ADMIN';"

# 本地环境
cd client
npx prisma studio
# 然后在浏览器中查看User表
```

### 通过Web界面验证

1. 使用管理员账号登录应用
2. 访问 `/admin` 路由
3. 确认能够访问管理后台
4. 检查是否有管理员特有的功能选项

---

## ⚠️ 常见问题

### Q1: 提示"DATABASE_URL环境变量未找到"

**问题**：直接运行 `npx tsx promote-admin.ts` 时找不到数据库连接。

**解决**：
- **Docker环境**：使用包装脚本 `./scripts/promote-admin-docker.sh`
- **本地环境**：确保 `.env` 文件存在且包含 `DATABASE_URL`

### Q2: 提示"未找到该邮箱的用户"

**问题**：用户尚未注册。

**解决**：
1. 先通过Web界面注册该账号
2. 然后再执行管理员提升操作

### Q3: 如何撤销管理员权限？

```bash
# 使用SQL降级为普通用户
docker compose exec app su-exec postgres psql -d homelabs_portal -c \
  "UPDATE users SET role = 'USER' WHERE email = 'user@example.com';"
```

### Q4: 如何批量提升多个用户？

```bash
# 进入PostgreSQL
docker compose exec app su-exec postgres psql -d homelabs_portal

# 使用SQL批量更新
UPDATE users SET role = 'ADMIN' 
WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com');
```

---

## 📊 用户角色说明

根据 `prisma/schema.prisma` 定义：

```prisma
enum Role {
  USER    // 普通用户（默认）
  ADMIN   // 管理员
}
```

### 权限对比

| 功能 | USER | ADMIN |
|------|------|-------|
| 浏览项目 | ✅ | ✅ |
| 创建项目 | ✅ | ✅ |
| 编辑自己的项目 | ✅ | ✅ |
| 删除自己的项目 | ✅ | ✅ |
| 访问 `/admin` 路由 | ❌ | ✅ |
| 管理所有用户 | ❌ | ✅ |
| 管理所有项目 | ❌ | ✅ |
| 查看统计信息 | ❌ | ✅ |
| 系统维护模式 | ❌ | ✅ |

---

## 🔐 安全建议

1. **最小权限原则**：只给必要的用户分配管理员权限
2. **定期审计**：定期检查管理员列表
3. **操作记录**：考虑添加管理员操作日志
4. **密码强度**：管理员账号必须使用强密码
5. **双因素认证**：生产环境建议启用2FA（待实现）

---

## 📚 相关文档

- [Docker All-in-One 部署文档](./DOCKER_ALLINONE_DEPLOYMENT.md)
- [数据库密码流程文档](./DATABASE_PASSWORD_FLOW.md)
- [安全指南](./SECURITY.md)

---

**最后更新**: 2025-11-28
**维护者**: AI Assistant

