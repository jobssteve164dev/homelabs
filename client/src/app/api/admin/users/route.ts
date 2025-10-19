import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthSession } from "@/types/auth";
import { Role, Prisma } from "@prisma/client";
import { logError, logInfo } from "@/lib/logger";
import { adminRateLimit, checkRateLimit } from "@/lib/ratelimit";

/**
 * GET /api/admin/users
 * 获取所有用户列表（仅管理员）
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
    const role = searchParams.get('role');

    // 构建查询条件
    const where: Prisma.UserWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role && (role === 'USER' || role === 'ADMIN')) {
      where.role = role as Role;
    }

    // 查询用户列表和总数
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          galaxyJoinedAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    const session = await getServerSession(authOptions) as AuthSession | null;
    logError("获取用户列表错误", error, { adminId: session?.user?.id });
    return NextResponse.json(
      { error: "服务器内部错误,请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * 更新用户信息（仅管理员）
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
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 不允许修改自己的角色
    if (userId === session.user.id) {
      return NextResponse.json({ error: "不能修改自己的角色" }, { status: 400 });
    }

    // 更新用户角色
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role || undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    // 记录管理操作
    logInfo("Admin updated user role", {
      adminId: session.user.id,
      targetUserId: userId,
      newRole: role,
    });
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    const session = await getServerSession(authOptions) as AuthSession | null;
    logError("更新用户错误", error, { adminId: session?.user?.id });
    return NextResponse.json(
      { error: "服务器内部错误,请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * 删除用户（仅管理员）
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 不允许删除自己
    if (userId === session.user.id) {
      return NextResponse.json({ error: "不能删除自己的账号" }, { status: 400 });
    }

    // 删除用户（关联的项目会自动级联删除）
    await prisma.user.delete({
      where: { id: userId }
    });
    
    // 记录管理操作
    logInfo("Admin deleted user", {
      adminId: session.user.id,
      deletedUserId: userId,
    });

    return NextResponse.json({ message: "用户删除成功" });
  } catch (error) {
    const session = await getServerSession(authOptions) as AuthSession | null;
    logError("删除用户错误", error, { adminId: session?.user?.id });
    return NextResponse.json(
      { error: "服务器内部错误,请稍后重试" },
      { status: 500 }
    );
  }
}

