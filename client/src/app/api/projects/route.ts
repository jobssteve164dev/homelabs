import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthSession } from "@/types/auth";
import { calculatePlanetOrbit } from "@/lib/galaxy/layout";

// 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AuthSession | null;
    
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: {
      authorId: string;
      category?: string;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
        tags?: { has: string };
      }>;
    } = {
      authorId: session.user.id
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

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
    console.error("获取项目列表错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// 创建新项目
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AuthSession | null;
    
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, tags, demoUrl, githubUrl, imageUrl } = body;

    // 验证必填字段
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "标题、描述和分类是必填项" },
        { status: 400 }
      );
    }

    // 获取该用户现有的所有行星项目，用于计算新行星的轨道
    const existingPlanets = await prisma.project.findMany({
      where: {
        authorId: session.user.id,
        projectType: 'PLANET',
        orbitRadius: { not: null }
      },
      select: {
        orbitRadius: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // 提取已使用的轨道半径
    const existingOrbits = existingPlanets
      .map(p => p.orbitRadius)
      .filter((r): r is number => r !== null);

    // 计算星系偏移（基于用户加入顺序）
    const allUsers = await prisma.user.findMany({
      orderBy: {
        galaxyJoinedAt: 'asc'
      },
      select: { id: true }
    });
    
    const userIndex = allUsers.findIndex(u => u.id === session.user.id);
    const galaxyOffset = userIndex >= 0 ? userIndex * 60 : 0;

    // 计算新行星的轨道参数
    const planetIndex = existingPlanets.length;
    const orbit = calculatePlanetOrbit(planetIndex, existingOrbits, galaxyOffset);

    const project = await prisma.project.create({
      data: {
        title,
        description,
        category,
        tags: tags || [],
        demoUrl,
        githubUrl,
        imageUrl,
        projectType: 'PLANET', // 默认创建的都是行星项目
        orbitRadius: orbit.radius,
        orbitAngle: orbit.angle,
        orbitSpeed: orbit.speed,
        authorId: session.user.id
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
      { message: "项目创建成功", project },
      { status: 201 }
    );
  } catch (error) {
    console.error("创建项目错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
