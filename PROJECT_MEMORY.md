# 项目长期记忆 (PROJECT_MEMORY.md)

*最后更新: 2025-01-16 19:00:18*

---

## 1. 项目概述 (Project Overview)

### a. 核心目标 (High-Level Goal)
构建一个面向私域流量的AI工具展示门户，采用科幻未来风格的视觉设计，为用户提供沉浸式的AI工具浏览和管理体验。

### b. 技术栈 (Tech Stack)
*   **前端**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS + Framer Motion
*   **3D效果**: Three.js + React Three Fiber
*   **UI组件**: Aceternity UI / Magic UI (科幻风格组件库)
*   **后端**: Next.js API Routes + Prisma ORM + PostgreSQL
*   **认证**: NextAuth.js
*   **部署环境**: Docker + ESXi虚拟机 + Nginx

---

## 2. 核心架构决策 (Key Architectural Decisions)

*   **[2025-01-16]**: 选择Next.js 14全栈架构。**原因**: 统一前后端开发体验，支持SSR/SSG，部署简单，生态丰富。
*   **[2025-01-16]**: 采用Prisma + PostgreSQL数据库方案。**原因**: 类型安全，开发效率高，适合复杂的数据关系。
*   **[2025-01-16]**: 使用Three.js实现科幻3D效果。**原因**: 提供沉浸式视觉体验，符合科幻未来主题。

---

## 3. 模块职责表 (Codebase Map)

*   `client/app/`: Next.js App Router应用入口，包含页面路由和API路由
*   `client/components/ui/`: 基础UI组件库
*   `client/components/3d/`: 3D效果相关组件
*   `client/components/portal/`: 门户特定业务组件
*   `client/lib/`: 工具函数和配置
*   `client/prisma/`: 数据库模型和迁移文件
*   `docker/`: Docker容器化配置
*   `scripts/`: 部署和开发脚本

---

## 4. 标准工作流与命令 (Standard Workflows & Commands)

*   **启动开发环境**: `./dev.sh` (一键启动所有服务)
*   **数据库操作**: `npx prisma studio` (数据库管理界面)
*   **代码风格检查**: `npm run lint`
*   **类型检查**: `npm run type-check`
*   **构建生产版本**: `npm run build`

---

## 5. 用户特定偏好与规范 (User-Specific Conventions)

*   **代码风格**: 使用Prettier + ESLint，遵循Next.js最佳实践
*   **组件设计**: 优先使用函数式组件 + TypeScript
*   **视觉风格**: 科幻未来感，深色主题 + 霓虹色彩
*   **部署方式**: ESXi虚拟机部署，Docker容器化

---

## 6. 重要提醒 (Critical Reminders)

*   **3D性能优化**: 提供降级方案，在低配设备上可关闭3D效果
*   **私域流量**: 需要完整的用户认证和权限管理系统
*   **ESXi资源**: 最低配置建议2核4G内存
*   **数据安全**: 所有用户数据需要加密存储和传输
