/**
 * 安全日志系统
 * 使用Winston进行结构化日志记录
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// 日志格式定义
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 控制台输出格式 (开发环境)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0 && meta.stack) {
      msg += `\n${meta.stack}`;
    } else if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// 日志目录配置
// - Docker生产环境: WORKDIR 通常为 /app, 日志目录为 /app/logs（已在 docker-compose 中挂载为 volume）
// - 本地开发环境: CWD 为项目根目录, 日志目录为 <project>/logs
// 通过 LOGS_DIR 可显式覆盖默认路径
const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');

// 创建日志传输器
const transports: winston.transport[] = [];

// 错误日志文件 (仅error级别)
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d',
    maxSize: '20m',
    format: logFormat,
  })
);

// 综合日志文件 (所有级别)
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    maxSize: '20m',
    format: logFormat,
  })
);

// 开发环境: 添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'debug',
    })
  );
}

// 创建Logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { 
    service: 'homelabs-portal',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  // 处理未捕获的异常
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
    }),
  ],
  // 处理未处理的Promise拒绝
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
    }),
  ],
});

/**
 * 安全的错误日志记录
 * 自动过滤敏感信息
 */
export function logError(message: string, error: unknown, context?: Record<string, unknown>) {
  const errorInfo: Record<string, unknown> = {
    message,
    ...context,
  };

  if (error instanceof Error) {
    errorInfo.error = error.message;
    // 仅在开发环境记录堆栈跟踪
    if (process.env.NODE_ENV === 'development') {
      errorInfo.stack = error.stack;
    }
  } else {
    errorInfo.error = String(error);
  }

  // 过滤敏感字段
  const sanitized = sanitizeSensitiveData(errorInfo);
  logger.error(sanitized);
}

/**
 * 安全的信息日志记录
 */
export function logInfo(message: string, context?: Record<string, unknown>) {
  const sanitized = sanitizeSensitiveData({ message, ...context });
  logger.info(sanitized);
}

/**
 * 安全的警告日志记录
 */
export function logWarn(message: string, context?: Record<string, unknown>) {
  const sanitized = sanitizeSensitiveData({ message, ...context });
  logger.warn(sanitized);
}

/**
 * 安全的调试日志记录
 */
export function logDebug(message: string, context?: Record<string, unknown>) {
  const sanitized = sanitizeSensitiveData({ message, ...context });
  logger.debug(sanitized);
}

/**
 * 过滤敏感信息
 * 移除密码、密钥等敏感字段
 */
function sanitizeSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'secret', 'token', 'key', 'authorization', 'auth'];
  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * 记录API请求
 */
export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  ip?: string,
  statusCode?: number,
  duration?: number
) {
  logInfo('API Request', {
    method,
    path,
    userId,
    ip,
    statusCode,
    duration: duration ? `${duration}ms` : undefined,
  });
}

/**
 * 记录安全事件
 */
export function logSecurityEvent(
  event: string,
  details?: Record<string, unknown>
) {
  logger.warn({
    message: 'Security Event',
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
}

export default logger;

