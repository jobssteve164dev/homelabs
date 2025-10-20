/**
 * PM2 Ecosystem配置文件
 * 
 * 工作原理:
 * 1. GitHub Actions创建 .env 文件（持久化配置）
 * 2. PM2使用此配置启动应用
 * 3. Next.js在npm start时自动读取.env文件
 * 
 * 优势:
 * - .env文件持久化存储配置
 * - 服务器重启后PM2自动重启应用，配置不丢失
 * - Next.js原生支持.env文件，无需额外配置
 * - 符合Next.js和PM2的最佳实践
 * 
 * 注意:
 * - 不在此处设置env，让Next.js从.env文件读取
 * - PM2只负责进程管理，不处理环境变量
 */

module.exports = {
  apps: [{
    name: 'homelabs-portal',
    script: 'npm',
    args: 'start',
    cwd: process.cwd(),
    
    // 只设置NODE_ENV，其他变量由Next.js从.env文件读取
    env: {
      NODE_ENV: 'production'
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

