# HOMELABS Portal - 安全最佳实践指南

**版本**: 1.0  
**最后更新**: 2025-10-19

---

## 📋 目录

1. [密码策略](#密码策略)
2. [环境变量管理](#环境变量管理)
3. [API安全](#api安全)
4. [数据库安全](#数据库安全)
5. [日志和监控](#日志和监控)
6. [部署安全](#部署安全)
7. [安全事件响应](#安全事件响应)

---

## 🔐 密码策略

### 密码要求

用户密码必须满足以下所有条件:
- 最少8个字符
- 包含至少1个大写字母
- 包含至少1个小写字母
- 包含至少1个数字
- 不能包含空格

### 密码存储

- 使用 `bcryptjs` 进行哈希加密
- 加密轮次: 12轮 (强度与性能的平衡)
- 密码字段在所有API响应中被严格排除

### 密码重置流程

1. 用户请求重置邮件
2. 系统发送包含一次性Token的邮件
3. Token有效期: 1小时
4. 重置后Token立即失效

---

## 🔑 环境变量管理

### 必需的环境变量

```bash
# 数据库配置
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"

# NextAuth.js配置
NEXTAUTH_URL="https://yourdomain.com"  # 生产环境域名
NEXTAUTH_SECRET="[使用 openssl rand -base64 32 生成]"

# 日志配置
LOG_LEVEL="info"  # development: debug, production: info/warn
```

### 安全规范

1. **绝对禁止**:
   - 将 `.env` 文件提交到Git
   - 在代码中硬编码密钥
   - 在日志中输出敏感信息
   - 使用默认或示例密钥

2. **强制要求**:
   - 生产环境使用随机生成的强密钥
   - 定期轮换密钥(建议每季度)
   - 使用环境隔离(开发/测试/生产)

3. **密钥生成**:
   ```bash
   # 生成强随机密钥
   openssl rand -base64 32
   
   # 或使用UUID
   uuidgen
   ```

### 检查清单

- [ ] `.env.local` 已添加到 `.gitignore`
- [ ] 所有密钥都是随机生成的
- [ ] 生产环境使用独立的数据库凭证
- [ ] 没有密钥出现在Git历史中

---

## 🛡️ API安全

### 认证与授权

1. **认证流程**:
   - 使用JWT Token进行会话管理
   - Token有效期: 7天
   - 自动续期机制: 最后3天自动延长

2. **权限验证**:
   ```typescript
   // 所有管理员API必须验证
   if (!session || session.user.role !== 'ADMIN') {
     return NextResponse.json({ error: "无权限访问" }, { status: 403 });
   }
   ```

3. **资源访问控制**:
   - 用户只能访问自己的资源
   - 管理员可以访问所有资源
   - 公开API不需要认证

### 输入验证

所有API都必须验证输入数据:

```typescript
import { validateRequest, createProjectSchema } from "@/lib/validation";

const validation = validateRequest(createProjectSchema, body);
if (!validation.success) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}
```

### CORS配置

生产环境必须明确指定允许的源:

```bash
ALLOWED_ORIGIN="https://yourdomain.com"
```

### 安全头

已在 `next.config.ts` 中配置:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy
- Referrer-Policy

---

## 🗄️ 数据库安全

### 连接安全

1. **连接池配置**:
   ```
   ?connection_limit=10&pool_timeout=20
   ```

2. **SSL连接** (生产环境推荐):
   ```
   ?sslmode=require
   ```

### SQL注入防护

- ✅ 全面使用Prisma ORM
- ✅ 所有查询自动参数化
- ❌ 禁止使用原始SQL (除非必要)

### 数据备份

1. **备份频率**: 每日自动备份
2. **保留期限**: 30天
3. **备份验证**: 每周测试恢复

### 敏感数据处理

- 密码: bcrypt哈希
- 个人信息: 加密存储(如需要)
- 日志: 自动脱敏

---

## 📊 日志和监控

### 日志系统

使用Winston进行结构化日志:

```typescript
import { logError, logInfo, logSecurityEvent } from "@/lib/logger";

// 记录错误
logError("操作失败", error, { userId, action });

// 记录安全事件
logSecurityEvent("Login attempt failed", { email, ip });
```

### 日志级别

- **debug**: 详细调试信息(仅开发环境)
- **info**: 一般操作日志
- **warn**: 警告信息
- **error**: 错误信息

### 监控指标

关键指标:
1. API响应时间
2. 错误率
3. 登录失败次数
4. 数据库连接状态

### 告警触发条件

- 错误率 > 1%
- API响应时间 > 500ms
- 连续登录失败 > 5次
- 数据库连接失败

---

## 🚀 部署安全

### 部署前检查清单

#### 环境配置
- [ ] 所有环境变量已正确配置
- [ ] NEXTAUTH_SECRET使用强随机密钥
- [ ] DATABASE_URL包含连接池参数
- [ ] NEXTAUTH_URL设置为生产域名

#### 代码安全
- [ ] 通过 `npm audit` 检查
- [ ] 无已知高危漏洞
- [ ] 所有密码验证已启用
- [ ] API速率限制已配置

#### 基础设施
- [ ] HTTPS已启用
- [ ] 安全头已配置
- [ ] 防火墙规则已设置
- [ ] 备份策略已实施

### Docker安全

1. **非root用户运行**:
   ```dockerfile
   USER nextjs
   ```

2. **最小镜像**:
   - 使用 `node:18-alpine`
   - 仅包含必需文件

3. **密钥注入**:
   ```bash
   docker run -e NEXTAUTH_SECRET=$SECRET ...
   ```

### Nginx安全

1. **隐藏版本信息**:
   ```nginx
   server_tokens off;
   ```

2. **限流配置**:
   ```nginx
   limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
   ```

3. **SSL配置**:
   ```nginx
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers HIGH:!aNULL:!MD5;
   ```

---

## 🚨 安全事件响应

### 事件分级

| 级别 | 描述 | 响应时间 |
|------|------|---------|
| P0 - 严重 | 数据泄露、系统被攻破 | 立即 |
| P1 - 高危 | 服务中断、认证绕过 | 1小时内 |
| P2 - 中危 | 功能异常、性能问题 | 4小时内 |
| P3 - 低危 | 一般性问题 | 24小时内 |

### 应急响应流程

#### 1. 发现阶段
- 监控告警触发
- 用户报告异常
- 日志分析发现

#### 2. 遏制阶段
- 隔离受影响系统
- 阻断攻击源IP
- 暂停受影响功能

#### 3. 根除阶段
- 修复漏洞
- 清理恶意代码
- 更换被泄露的密钥

#### 4. 恢复阶段
- 从备份恢复数据
- 逐步恢复服务
- 验证系统安全

#### 5. 总结阶段
- 撰写事件报告
- 改进安全措施
- 更新响应流程

### 常见安全事件处理

#### 密钥泄露
1. 立即生成新密钥
2. 更新所有环境配置
3. 重启所有服务
4. 清理Git历史(如需要)
5. 通知受影响用户

#### 暴力破解攻击
1. 封禁攻击源IP
2. 临时提高登录验证难度
3. 通知管理员
4. 分析攻击模式

#### 数据泄露
1. 立即隔离系统
2. 评估泄露范围
3. 通知受影响用户
4. 提供补救措施
5. 报告相关部门

---

## 📞 联系方式

### 安全问题报告

如发现安全漏洞,请发送邮件至:
- **邮箱**: security@yourdomain.com
- **加密**: 使用PGP密钥
- **响应时间**: 24小时内

### 漏洞奖励计划

我们欢迎安全研究者报告漏洞:
- 严重漏洞: $500-$2000
- 高危漏洞: $200-$500
- 中危漏洞: $50-$200

---

## 📚 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Prisma Security](https://www.prisma.io/docs/guides/database/advanced-database-tasks/sql-injection)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)

---

**最后审查**: 2025-10-19  
**下次审查**: 2026-01-19 (3个月后)

---

*本文档持续更新,请定期查看最新版本。*

