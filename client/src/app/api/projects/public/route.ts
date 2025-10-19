import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 获取所有公开项目（用于首页展示）
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        isActive: true
      },
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
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("获取公开项目列表错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
