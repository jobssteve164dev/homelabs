import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthSession } from "@/types/auth";
import { Prisma } from "@prisma/client";
import { logError, logInfo } from "@/lib/logger";
import { adminRateLimit, checkRateLimit } from "@/lib/ratelimit";

/**
 * GET /api/admin/projects
 * 获取所有项目列表（仅管理员）
 * 
 * 数据来源: 真实的PostgreSQL数据库查询
 * 数据流: API -> Prisma -> PostgreSQL
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AuthSession | null;
    
    // 验证管理员权限
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }
    
    // 速率限制检查
    const rateLimitResponse = await checkRateLimit(request, adminRateLimit);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const projectType = searchParams.get('projectType');

    // 构建查询条件
    const where: Prisma.ProjectWhereInput = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (projectType && (projectType === 'STAR' || projectType === 'PLANET')) {
      where.projectType = projectType;
    }

    // 查询项目列表和总数
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.project.count({ where })
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    const session = await getServerSession(authOptions) as AuthSession | null;
    logError("获取项目列表错误", error, { adminId: session?.user?.id });
    return NextResponse.json(
      { error: "服务器内部错误,请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/projects
 * 更新项目状态（仅管理员）
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AuthSession | null;
    
    // 验证管理员权限
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }
    
    // 速率限制检查
    const rateLimitResponse = await checkRateLimit(request, adminRateLimit);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { projectId, isActive } = body;

    if (!projectId) {
      return NextResponse.json({ error: "缺少项目ID" }, { status: 400 });
    }

    // 更新项目状态
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        isActive: isActive !== undefined ? isActive : undefined
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // 记录管理操作
    logInfo("Admin updated project status", {
      adminId: session.user.id,
      projectId,
      isActive,
    });
    
    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    const session = await getServerSession(authOptions) as AuthSession | null;
    logError("更新项目错误", error, { adminId: session?.user?.id });
    return NextResponse.json(
      { error: "服务器内部错误,请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/projects
 * 删除项目（仅管理员）
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AuthSession | null;
    
    // 验证管理员权限
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }
    
    // 速率限制检查
    const rateLimitResponse = await checkRateLimit(request, adminRateLimit);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: "缺少项目ID" }, { status: 400 });
    }

    // 删除项目
    await prisma.project.delete({
      where: { id: projectId }
    });
    
    // 记录管理操作
    logInfo("Admin deleted project", {
      adminId: session.user.id,
      deletedProjectId: projectId,
    });

    return NextResponse.json({ message: "项目删除成功" });
  } catch (error) {
    const session = await getServerSession(authOptions) as AuthSession | null;
    logError("删除项目错误", error, { adminId: session?.user?.id });
    return NextResponse.json(
      { error: "服务器内部错误,请稍后重试" },
      { status: 500 }
    );
  }
}

