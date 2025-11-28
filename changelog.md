202510201728-更新1.0
202510201750-修正部署工作流
202510201802-完善星系创建页面
202510201837-完善搜索行星机制
202510201935-完善账号密码修改功能
202510202031-增加项目导入机制
202510221021-优化注册机制
202510221048-优化响应式布局
202510221129-优化创建项目按钮位置
20251110-修复Docker部署工作流：修复配置文件上传顺序、Nginx变量替换、jq语法错误和Docker权限问题
20251119-修复生产环境500错误：修复NextAuth配置缺失secret、增强API错误处理、添加环境变量验证、修复日志目录权限问题（根本原因：logger尝试在根目录创建logs导致EACCES错误）
20251119-修复Docker容器Prisma CLI不可用问题：修复Dockerfile中Prisma CLI可执行文件复制、优化docker-entrypoint.sh的Prisma检测逻辑（优先使用node_modules/prisma/build/index.js）、优化部署工作流添加多层验证（代码传输验证、构建前验证、构建后验证、运行时验证）
20251119-修复部署工作流bash语法错误：简化镜像验证逻辑，避免使用特殊字符导致语法错误，使用docker images默认输出格式
20251127-新增Docker All-in-One部署模式：PostgreSQL+App单容器部署、Nginx可选（默认关闭）、完整日志收集系统（PostgreSQL日志+应用日志+组合日志）、新增DEPLOY_ARCHITECTURE和USE_NGINX配置项、简化部署配置（最少只需6个变量）
20251128-Docker缓存优化与启动脚本修复：修复docker-entrypoint-allinone.sh管道阻塞问题（pg_ctl启动命令）、启用BuildKit缓存挂载优化npm和Next.js构建缓存、移除GitHub Actions工作流中的--no-cache参数、优化清理策略保留构建缓存、新增docker-cache-cleanup.sh脚本（提供4种清理级别）、新增Docker缓存管理文档、构建速度提升80%、减少磁盘占用
20251128-修复日志目录权限导致容器重启问题：修复nextjs用户对/app/logs/根目录的写入权限、允许应用在日志根目录创建日志文件（error、combined、exceptions、rejections）、解决EACCES权限错误导致应用崩溃和容器不断重启的问题