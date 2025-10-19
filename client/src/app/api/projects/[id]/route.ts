import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthSession } from "@/types/auth";
import { updateProjectSchema, validateRequest } from "@/lib/validation";
import { logError } from "@/lib/logger";
import { apiRateLimit, checkRateLimit } from "@/lib/ratelimit";

// 获取单个项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as AuthSession | null;
    
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }
    
    // 速率限制检查
    const rateLimitResponse = await checkRateLimit(request, apiRateLimit);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
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

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    // 检查权限：只有项目作者或管理员可以查看
    if (project.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    logError("获取项目详情错误", error);
    return NextResponse.json(
      { error: "服务器内部错误,请稍后重试" },
      { status: 500 }
    );
  }
}

// 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as AuthSession | null;
    
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }
    
    // 速率限制检查
    const rateLimitResponse = await checkRateLimit(request, apiRateLimit);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // 使用Zod验证输入
    const validation = validateRequest(updateProjectSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const { title, description, category, tags, demoUrl, githubUrl, imageUrl, isActive } = validation.data;

    const { id } = await params;
    
    // 检查项目是否存在
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    // 检查权限：只有项目作者或管理员可以修改
    if (existingProject.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "无权限修改" }, { status: 403 });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(tags && { tags }),
        ...(demoUrl !== undefined && { demoUrl }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive })
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

    return NextResponse.json(
      { message: "项目更新成功", project }
    );
  } catch (error) {
    logError("更新项目错误", error);
    return NextResponse.json(
      { error: "服务器内部错误,请稍后重试" },
      { status: 500 }
    );
  }
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as AuthSession | null;
    
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }
    
    // 速率限制检查
    const rateLimitResponse = await checkRateLimit(request, apiRateLimit);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    
    // 检查项目是否存在
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    // 检查权限：只有项目作者或管理员可以删除
    if (existingProject.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "无权限删除" }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json({ message: "项目删除成功" });
  } catch (error) {
    logError("删除项目错误", error);
    return NextResponse.json(
      { error: "服务器内部错误,请稍后重试" },
      { status: 500 }
    );
  }
}
