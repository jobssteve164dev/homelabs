import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthSession } from "@/types/auth";

/**
 * GET /api/admin/stats
 * 获取系统统计数据（仅管理员）
 * 
 * 数据来源: 真实的PostgreSQL数据库查询
 * 数据流: API -> Prisma -> PostgreSQL
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as AuthSession | null;
    
    // 验证管理员权限
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }

    // 并行查询所有统计数据
    const [
      totalUsers,
      totalProjects,
      activeProjects,
      viewCountSum,
      likeCountSum,
      recentProjects
    ] = await Promise.all([
      // 总用户数
      prisma.user.count(),
      
      // 总项目数
      prisma.project.count(),
      
      // 活跃项目数
      prisma.project.count({
        where: { isActive: true }
      }),
      
      // 总浏览量
      prisma.project.aggregate({
        _sum: { viewCount: true }
      }),
      
      // 总点赞数
      prisma.project.aggregate({
        _sum: { likeCount: true }
      }),
      
      // 最近的项目
      prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalProjects,
        activeProjects,
        totalViews: viewCountSum._sum.viewCount || 0,
        totalLikes: likeCountSum._sum.likeCount || 0
      },
      recentProjects
    });
  } catch (error) {
    console.error("获取统计数据错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

