import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProjectType } from "@prisma/client";

export const dynamic = 'force-dynamic'

/**
 * GET /api/planets/search?q=keyword&limit=20
 * 全局搜索活跃的行星项目，按更新时间倒序
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    if (!q) {
      return NextResponse.json({ planets: [] });
    }

    const projects = await prisma.project.findMany({
      where: {
        projectType: ProjectType.PLANET,
        isActive: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tags: { has: q } },
          { author: { name: { contains: q, mode: 'insensitive' } } }
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            galaxyX: true,
            galaxyY: true,
            galaxyZ: true,
          }
        }
      }
    });

    const planets = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      category: project.category,
      tags: project.tags,
      demoUrl: project.demoUrl,
      githubUrl: project.githubUrl,
      imageUrl: project.imageUrl,
      viewCount: project.viewCount,
      likeCount: project.likeCount,
      author: {
        id: project.author.id,
        name: project.author.name || 'Unknown',
        email: project.author.email,
        galaxyCenter: {
          x: project.author.galaxyX || 0,
          y: project.author.galaxyY || 0,
          z: project.author.galaxyZ || 0,
        }
      },
      orbitRadius: project.orbitRadius || 3,
      orbitAngle: project.orbitAngle || 0,
      orbitSpeed: project.orbitSpeed || 0.1,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }));

    return NextResponse.json({ planets });
  } catch (error) {
    console.error('搜索行星失败:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}


