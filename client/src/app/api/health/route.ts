/**
 * 健康检查端点
 * 用于监控系统运行状态
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const startTime = Date.now();
    
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    
    const dbLatency = Date.now() - startTime;
    
    // 返回健康状态
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`
        },
        application: {
          status: 'running',
          environment: process.env.NODE_ENV || 'unknown'
        }
      },
      uptime: process.uptime(),
    });
  } catch (error) {
    // 数据库连接失败
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          application: {
            status: 'running',
            environment: process.env.NODE_ENV || 'unknown'
          }
        }
      },
      { status: 503 }
    );
  }
}

