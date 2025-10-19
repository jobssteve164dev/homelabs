/**
 * API速率限制系统
 * 支持内存和Redis两种模式
 * 
 * 使用方法:
 * 1. 内存模式(默认,无需配置): 适用于单节点部署
 * 2. Redis模式(推荐生产): 配置UPSTASH_REDIS_REST_URL环境变量
 */

import { NextRequest, NextResponse } from "next/server";
import { logWarn } from "./logger";

// Redis模式(如果配置了环境变量)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Ratelimit: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Redis: any = null;

// 尝试导入Upstash(如果已安装)
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const upstashModule = require("@upstash/ratelimit");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const redisModule = require("@upstash/redis");
    Ratelimit = upstashModule.Ratelimit;
    Redis = redisModule.Redis;
  }
} catch {
  // Upstash未安装,使用内存模式
}

// 内存存储(用于单节点部署)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

/**
 * 内存模式速率限制
 */
class MemoryRateLimit {
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async limit(identifier: string): Promise<{ success: boolean; reset: number }> {
    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    
    // 清理过期记录(每1000次请求清理一次,避免内存泄漏)
    if (Math.random() < 0.001) {
      this.cleanup();
    }

    const entry = memoryStore.get(key);

    if (!entry || now > entry.resetTime) {
      // 新窗口或过期
      memoryStore.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { success: true, reset: now + this.windowMs };
    }

    if (entry.count >= this.limit) {
      // 超过限制
      return { success: false, reset: entry.resetTime };
    }

    // 增加计数
    entry.count++;
    return { success: true, reset: entry.resetTime };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetTime) {
        memoryStore.delete(key);
      }
    }
  }
}

/**
 * 创建速率限制器
 */
function createRateLimiter(limit: number, windowMs: number) {
  // 如果配置了Redis,使用Redis模式
  if (Ratelimit && Redis) {
    try {
      return new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(limit, `${windowMs / 1000}s`),
        analytics: true,
      });
    } catch (error) {
      logWarn("Redis速率限制初始化失败,降级到内存模式", { error });
    }
  }

  // 否则使用内存模式
  return new MemoryRateLimit(limit, windowMs);
}

/**
 * 登录API速率限制: 每分钟5次
 */
export const loginRateLimit = createRateLimiter(5, 60 * 1000);

/**
 * 注册API速率限制: 每小时3次
 */
export const registerRateLimit = createRateLimiter(3, 60 * 60 * 1000);

/**
 * 通用API速率限制: 每分钟60次
 */
export const apiRateLimit = createRateLimiter(60, 60 * 1000);

/**
 * 管理员API速率限制: 每分钟30次
 */
export const adminRateLimit = createRateLimiter(30, 60 * 1000);

/**
 * 速率限制中间件辅助函数
 * 
 * @param request NextRequest对象
 * @param rateLimiter 速率限制器实例
 * @returns 如果被限流则返回错误响应,否则返回null
 */
export async function checkRateLimit(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rateLimiter: any
): Promise<NextResponse | null> {
  try {
    // 获取客户端标识符(优先使用IP,否则使用随机标识)
    const identifier = 
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'anonymous';

    // 检查速率限制
    const result = await rateLimiter.limit(identifier);

    if (!result.success) {
      // 记录限流事件
      logWarn('Rate limit exceeded', {
        ip: identifier,
        path: request.nextUrl.pathname,
        method: request.method,
      });

      // 返回429错误
      return NextResponse.json(
        { 
          error: "请求过于频繁,请稍后再试",
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
          }
        }
      );
    }

    return null;
  } catch (error) {
    // 速率限制失败时不阻塞请求(降级策略)
    logWarn('Rate limit check failed, allowing request', { error });
    return null;
  }
}

/**
 * 获取当前速率限制模式
 */
export function getRateLimitMode(): 'redis' | 'memory' {
  return Ratelimit && Redis ? 'redis' : 'memory';
}

/**
 * 清理内存存储(仅用于测试)
 */
export function clearMemoryStore() {
  memoryStore.clear();
}

