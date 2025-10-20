/**
 * PM2 Ecosystem配置文件
 * 
 * 此配置确保PM2在启动Next.js应用时正确传递环境变量
 * 
 * 工作原理:
 * 1. GitHub Actions在SSH会话中export环境变量
 * 2. PM2读取当前shell的process.env
 * 3. 将这些变量传递给Next.js应用
 * 
 * 优势:
 * - 保持变量的灵活性（从GitHub Variables/Secrets动态加载）
 * - 无需硬编码任何配置值
 * - 符合PM2最佳实践
 */

module.exports = {
  apps: [{
    name: 'homelabs-portal',
    script: 'npm',
    args: 'start',
    cwd: process.cwd(),
    
    // 环境变量配置
    // PM2会从当前shell的process.env中读取这些变量
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000,
      
      // 数据库配置
      DATABASE_URL: process.env.DATABASE_URL,
      
      // NextAuth配置
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      
      // 应用配置
      APP_URL: process.env.APP_URL,
      
      // 日志配置
      LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    },
    
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true,
    
    // 错误处理
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    
    // 实例配置
    instances: 1,
    exec_mode: 'fork'
  }]
};

