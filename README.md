# HOMELABS Portal - 科幻未来风私域AI工具门户

<div align="center">

![HOMELABS Portal](https://img.shields.io/badge/HOMELABS-Portal-00ffff?style=for-the-badge&logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

**面向私域流量的沉浸式AI工具展示平台，融合科幻美学与前沿技术**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

## ✨ 项目特色

### 🚀 科幻未来感设计
- **赛博朋克风格**: 深色主题 + 霓虹蓝/紫/青色渐变
- **3D视觉效果**: Three.js + React Three Fiber 打造沉浸式体验
- **动态交互**: Framer Motion 提供流畅的动画效果
- **玻璃态设计**: 现代玻璃态拟态效果

### 🛡️ 私域流量管理
- **用户认证系统**: 完整的注册/登录/权限管理
- **访问控制**: 基于角色的权限系统
- **数据安全**: 加密存储和传输
- **会话管理**: JWT Token + Session 双重保障

### 🎯 核心功能
- **AI工具展示**: 科幻风格的3D卡片展示
- **项目管理**: 完整的CRUD操作
- **数据分析**: 实时统计和可视化
- **管理后台**: 用户和内容管理

## 🏗️ 技术架构

### 前端技术栈
- **Next.js 14** - 全栈React框架，支持SSR/SSG
- **React 18** - 现代UI框架
- **TypeScript** - 类型安全开发
- **Tailwind CSS** - 原子化CSS框架
- **Framer Motion** - 动画库
- **Three.js** - 3D图形库
- **Lucide React** - 图标库

### 后端技术栈
- **Next.js API Routes** - 后端API
- **Prisma ORM** - 数据库操作
- **PostgreSQL** - 主数据库
- **NextAuth.js** - 认证系统
- **bcryptjs** - 密码加密

### 部署技术
- **Docker** - 容器化部署
- **Docker Compose** - 多服务编排
- **Nginx** - 反向代理
- **ESXi** - 虚拟机部署

## 🚀 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 13+
- Docker (可选)

### 一键启动

```bash
# 克隆项目
git clone <repository-url>
cd HOMELABS

# 一键启动开发环境
./dev.sh
```

开发脚本会自动：
- ✅ 检查系统依赖
- ✅ 安装项目依赖
- ✅ 启动PostgreSQL数据库
- ✅ 初始化数据库结构
- ✅ 运行种子数据
- ✅ 启动开发服务器

### 手动启动

```bash
# 进入客户端目录
cd client

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件

# 初始化数据库
npx prisma generate
npx prisma db push
npx prisma db seed

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看应用

## 📁 项目结构

```
HOMELABS/
├── client/                    # 前端应用
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   │   ├── (auth)/       # 认证相关页面
│   │   │   ├── (dashboard)/  # 仪表盘
│   │   │   ├── (portal)/     # 门户展示页
│   │   │   └── api/          # API路由
│   │   ├── components/       # 可复用组件
│   │   │   ├── ui/           # 基础UI组件
│   │   │   ├── 3d/           # 3D组件
│   │   │   └── portal/       # 门户特定组件
│   │   └── lib/              # 工具库
│   ├── prisma/               # Prisma配置
│   └── public/               # 静态资源
├── docker/                   # Docker配置
├── docs/                     # 文档
├── scripts/                  # 部署脚本
├── dev.sh                    # 开发环境启动脚本
├── dev.local                 # 开发环境配置
└── PROJECT_MEMORY.md         # 项目记忆文件
```

## 🎨 设计系统

### 色彩方案
- **主色调**: 霓虹蓝 (#00ffff)
- **辅助色**: 霓虹紫 (#ff00ff)
- **强调色**: 霓虹绿 (#00ff00)
- **背景色**: 深色主题 (#0a0a0a)

### 字体系统
- **显示字体**: Orbitron (科幻感)
- **正文字体**: Inter (现代感)
- **等宽字体**: JetBrains Mono (代码)

### 动画效果
- **页面过渡**: 淡入淡出 + 滑动
- **悬停效果**: 缩放 + 发光
- **加载动画**: 脉冲 + 旋转
- **3D效果**: 旋转网格 + 粒子系统

## 🔧 开发指南

### 可用脚本

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 代码质量
npm run lint         # 代码检查
npm run lint:fix     # 自动修复
npm run type-check   # 类型检查

# 数据库
npm run db:generate  # 生成Prisma客户端
npm run db:push      # 推送数据库变更
npm run db:studio    # 打开数据库管理界面
npm run db:seed      # 运行种子数据
npm run db:reset     # 重置数据库
```

### 环境变量

```bash
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/homelabs_portal"

# NextAuth.js 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# 应用配置
NODE_ENV="development"
PORT=3000
```

## 🐳 Docker 部署

### 开发环境

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 生产环境

```bash
# 构建生产镜像
docker-compose -f docker-compose.prod.yml build

# 启动生产服务
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 功能特性

### 用户系统
- [x] 用户注册/登录
- [x] 密码加密存储
- [x] JWT Token认证
- [x] 角色权限管理
- [x] 用户资料管理

### 项目管理
- [x] AI工具项目展示
- [x] 项目分类和标签
- [x] 项目详情页面
- [x] 在线演示功能
- [x] 项目统计功能

### 管理后台
- [x] 用户管理
- [x] 项目管理
- [x] 数据统计
- [x] 系统设置

### 数据分析
- [x] 访问量统计
- [x] 用户行为分析
- [x] 项目热度排行
- [x] 实时数据监控

## 🔒 安全特性

- **密码加密**: bcryptjs 哈希加密
- **JWT认证**: 安全的Token机制
- **CORS配置**: 跨域请求控制
- **输入验证**: 前后端双重验证
- **SQL注入防护**: Prisma ORM保护
- **XSS防护**: 内容安全策略

## 📈 性能优化

- **SSR/SSG**: Next.js服务端渲染
- **图片优化**: Next.js Image组件
- **代码分割**: 动态导入
- **缓存策略**: 多层缓存机制
- **CDN加速**: 静态资源分发
- **数据库优化**: 索引和查询优化

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React全栈框架
- [Prisma](https://prisma.io/) - 现代数据库工具
- [Three.js](https://threejs.org/) - 3D图形库
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

## 📞 联系我们

- **项目地址**: [GitHub Repository](https://github.com/your-username/homelabs-portal)
- **问题反馈**: [Issues](https://github.com/your-username/homelabs-portal/issues)
- **功能建议**: [Discussions](https://github.com/your-username/homelabs-portal/discussions)

---

<div align="center">

**让AI触手可及，让未来触手可及** 🚀

Made with ❤️ by HOMELABS Team

</div>
