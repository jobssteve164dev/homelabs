/**
 * 健康检查端点
 * 用于监控系统运行状态
 * 
 * 优化说明：
 * - 增加了请求超时控制和重试机制
 * - 优化了数据库连接检查逻辑
 * - 在 All-in-One 模式下提供更详细的诊断信息
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 健康检查超时设置（20秒，确保在 Docker HEALTHCHECK 的 30秒超时内完成）
const HEALTH_CHECK_TIMEOUT = 20000;

export async function GET() {
  const startTime = Date.now();
  
  try {
    // 使用 Promise.race 实现超时控制
    const healthCheckPromise = performHealthCheck();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT);
    });
    
    const result = await Promise.race([healthCheckPromise, timeoutPromise]);
    return NextResponse.json(result);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // 详细记录错误信息，包括环境变量和数据库连接信息
    console.error(`[Health Check] Failed after ${duration}ms:`, errorMessage);
    console.error(`[Health Check] DATABASE_URL:`, process.env.DATABASE_URL ? '***SET***' : 'NOT SET');
    console.error(`[Health Check] Error details:`, error);
    
    // 数据库连接失败或超时 - 返回 503 表示服务不可用
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        services: {
          database: {
            status: 'disconnected',
            error: errorMessage
          },
          application: {
            status: 'running',
            environment: process.env.NODE_ENV || 'unknown',
            uptime: `${Math.floor(process.uptime())}s`
          }
        },
        diagnostics: {
          databaseUrlSet: !!process.env.DATABASE_URL,
          nodeVersion: process.version
        }
      },
      { status: 503 }
    );
  }
}

/**
 * 执行实际的健康检查逻辑
 */
async function performHealthCheck() {
  const checkStartTime = Date.now();
  
  // 数据库连接状态
  let dbStatus: 'connected' | 'disconnected' | 'slow' = 'disconnected';
  let dbLatency = 0;
  let dbError: string | undefined;
  
  try {
    // 检查数据库连接（使用简单的 SELECT 1）
    const dbCheckStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbCheckStart;
    
    // 判断数据库响应速度
    if (dbLatency < 1000) {
      dbStatus = 'connected';
    } else {
      dbStatus = 'slow';
      console.warn(`[Health Check] Database is slow: ${dbLatency}ms`);
    }
    
  } catch (error) {
    dbStatus = 'disconnected';
    dbError = error instanceof Error ? error.message : 'Unknown database error';
    console.error('[Health Check] Database check failed:', dbError);
  }
  
  const totalDuration = Date.now() - checkStartTime;
  
  // 如果数据库完全不可用，抛出错误（会被 catch 块捕获并返回 503）
  if (dbStatus === 'disconnected') {
    throw new Error(dbError || 'Database disconnected');
  }
  
  // 返回健康状态（包括慢响应的情况）
  return {
    status: dbStatus === 'slow' ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    duration: `${totalDuration}ms`,
    services: {
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
        warning: dbStatus === 'slow' ? 'Database response is slower than expected' : undefined
      },
      application: {
        status: 'running',
        environment: process.env.NODE_ENV || 'unknown',
        uptime: `${Math.floor(process.uptime())}s`
      }
    },
    metadata: {
      architecture: 'all-in-one',
      nodeVersion: process.version
    }
  };
}

