/**
 * 客户端日志工具
 * 
 * 在开发环境输出详细日志,在生产环境仅记录错误到服务端
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 客户端错误日志
 * - 开发环境: 输出到console
 * - 生产环境: 静默或发送到服务端
 */
export function logClientError(message: string, error?: unknown) {
  if (isDevelopment) {
    console.error(`[Client Error] ${message}`, error);
  } else {
    // 生产环境可以选择:
    // 1. 完全静默
    // 2. 发送到服务端日志API (未来可实现)
    // 3. 发送到第三方错误追踪服务 (如Sentry)
    
    // 当前选择: 静默,避免暴露信息
    // 未来可以实现: 发送到 /api/logs/client
  }
}

/**
 * 客户端警告日志
 */
export function logClientWarn(message: string, data?: unknown) {
  if (isDevelopment) {
    console.warn(`[Client Warn] ${message}`, data);
  }
}

/**
 * 客户端信息日志
 */
export function logClientInfo(message: string, data?: unknown) {
  if (isDevelopment) {
    console.log(`[Client Info] ${message}`, data);
  }
}

/**
 * 客户端调试日志
 */
export function logClientDebug(message: string, data?: unknown) {
  if (isDevelopment) {
    console.debug(`[Client Debug] ${message}`, data);
  }
}

