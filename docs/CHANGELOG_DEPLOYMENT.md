# 基于 Changelog 的自动部署指南

## 📋 概述

项目已配置为**监控 `changelog.md` 文件的变更**来自动触发生产环境部署。这是一种简单、可控且易于追踪的部署触发机制。

## 🎯 核心原理

GitHub Actions 工作流 `.github/workflows/deploy-local.yml` 配置如下：

```yaml
on:
  # 监控 changelog.md 文件变更，自动触发部署
  push:
    branches:
      - main
    paths:
      - 'changelog.md'
  
  # 保留手动触发方式
  workflow_dispatch:
    inputs:
      deploy_mode:
        description: '部署模式'
        required: true
        default: 'all'
        type: choice
        options:
          - all          # 全部部署
          - frontend     # 仅前端
          - backend      # 仅后端
          - check        # 仅检查环境
```

**触发条件**：
- ✅ 推送到 `main` 分支
- ✅ 变更包含 `changelog.md` 文件
- ✅ 自动触发完整的部署流程

**默认部署模式**：
- 🔄 **自动触发**（changelog 变更）：默认使用 `all` 模式（完整部署前端+后端）
- 🖱️ **手动触发**：可以选择 `all`、`frontend`、`backend` 或 `check` 模式

## 📝 使用方法

### 方法一：标准部署流程（推荐）

1. **完成代码开发和测试**
   ```bash
   # 提交所有代码变更
   git add .
   git commit -m "feat: 实现XX功能"
   ```

2. **更新 changelog.md**
   ```bash
   # 编辑 changelog.md，添加新的版本记录
   echo "$(date +%Y%m%d%H%M)-版本说明" > changelog.md
   
   # 或者手动编辑，格式建议：
   # YYYYMMDDHHMM-功能描述
   # 例如：202510201730-优化空项目界面设计
   ```

3. **提交并推送 changelog**
   ```bash
   git add changelog.md
   git commit -m "chore: 更新changelog触发部署"
   git push origin main
   ```

4. **自动部署**
   - GitHub Actions 检测到 `changelog.md` 变更
   - 自动触发 `deploy-local.yml` 工作流
   - 执行完整的部署流程

### 方法二：一键部署命令

```bash
# 创建一键部署脚本（首次执行）
cat > deploy.sh << 'EOF'
#!/bin/bash
echo "$(date +%Y%m%d%H%M)-部署版本" > changelog.md
git add changelog.md
git commit -m "chore: 触发部署 $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main
echo "✅ 部署触发成功！请在 GitHub Actions 中查看部署进度"
EOF

chmod +x deploy.sh

# 使用时直接运行
./deploy.sh
```

## 📊 Changelog 格式建议

推荐使用以下格式来维护 `changelog.md`：

```
# 项目更新日志

## 202510201730 - v1.2.0
- 优化空项目界面设计
- 实现用户注册自动创建恒星功能
- 修复若干UI问题

## 202510191800 - v1.1.0
- 实现AI宇宙星系系统
- 添加管理员后台功能
- 优化性能监控

## 202510161200 - v1.0.0
- 初始版本发布
```

或者简化版本（当前使用的格式）：

```
202510201730-优化空项目界面
```

## 🔍 监控部署状态

### 1. GitHub Actions 页面
- 访问仓库的 Actions 标签页
- 查找 "本地环境部署（非Docker）" 工作流
- 查看实时部署日志和状态

### 2. 部署成功标志
- ✅ 所有步骤显示绿色对勾
- ✅ "验证部署" 步骤通过
- ✅ PM2 服务状态正常
- ✅ 服务健康检查通过

### 3. 部署失败处理
- ❌ 查看失败步骤的详细日志
- ❌ 工作流会自动回滚到上一个版本
- ❌ 修复问题后再次更新 changelog 重新部署

## ⚙️ 工作流配置说明

当前工作流支持以下部署模式：

### 自动触发（changelog 驱动）
```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'changelog.md'
```

### 手动触发（保留功能）
- 访问 GitHub Actions 页面
- 选择 "本地环境部署（非Docker）" 工作流
- 点击 "Run workflow"
- 选择部署模式：
  - `all`: 全部部署（前端+后端）
  - `frontend`: 仅部署前端
  - `backend`: 仅部署后端
  - `check`: 仅检查环境

## 🚀 最佳实践

### 1. 版本控制策略
```bash
# 主要功能发布
202510201730-v1.2.0-用户系统优化

# 紧急修复
202510201745-hotfix-修复登录问题

# 性能优化
202510201800-perf-优化数据库查询
```

### 2. 部署前检查清单
- [ ] 本地测试通过
- [ ] 代码已提交到 main 分支
- [ ] 更新了 changelog.md
- [ ] 确认 GitHub Secrets 配置正确
- [ ] 服务器资源充足

### 3. 部署后验证
```bash
# 检查服务状态
ssh user@server "pm2 list"

# 查看最新日志
ssh user@server "pm2 logs planovai-backend --lines 50"

# 测试 API 接口
curl https://your-domain.com/api/health
```

## 🔧 故障排查

### 问题1：部署未自动触发
**检查**：
```bash
# 确认 changelog.md 确实被修改
git log -1 --stat

# 确认推送到了 main 分支
git branch --show-current
```

### 问题2：部署失败
**查看日志**：
1. GitHub Actions 页面查看详细日志
2. 定位到具体失败的步骤
3. 根据错误信息修复问题

**常见原因**：
- 服务器连接失败（检查 SSH 配置）
- 依赖安装失败（检查网络和磁盘空间）
- 环境变量缺失（检查 GitHub Secrets）
- 构建失败（检查代码语法错误）

### 问题3：回滚机制
工作流内置自动回滚功能：
- 部署失败时自动恢复到上一个版本
- 备份保留3个历史版本
- 手动回滚：`cp -r /opt/pmp_backup_XXXXXX /opt/pmp`

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md)
- [安全配置](./SECURITY.md)
- [工作流模板](../template/deploy-local.yml)
- [快速开始](../template/QUICKSTART.md)

## 💡 提示

- 建议在每次重要功能更新时更新 changelog
- changelog 格式保持一致性，便于追踪
- 部署前确保在本地环境充分测试
- 使用有意义的版本号和描述
- 保持 changelog 文件简洁，详细说明放在提交信息中

---

**最后更新**: 2025-10-20
**维护者**: AI Assistant

