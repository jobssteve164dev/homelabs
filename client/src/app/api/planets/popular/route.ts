import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ProjectType } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/planets/popular
 * 获取最受欢迎的10个星球（按点赞数排序）
 * 
 * 数据来源: 真实的PostgreSQL数据库查询
 * 数据流: API -> Prisma -> PostgreSQL
 */
export async function GET() {
  try {
    // 获取最受欢迎的10个行星项目
    const popularPlanets = await prisma.project.findMany({
      where: {
        projectType: ProjectType.PLANET, // 只获取行星项目
        isActive: true, // 只获取活跃项目
      },
      orderBy: [
        { likeCount: 'desc' }, // 按点赞数降序
        { viewCount: 'desc' }, // 点赞数相同时按浏览量降序
        { createdAt: 'desc' }  // 最后按创建时间降序
      ],
      take: 10, // 只取前10个
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
    })

    // 转换为前端需要的数据格式
    const planets = popularPlanets.map(project => ({
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
      
      // 作者信息
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
      
      // 轨道参数
      orbitRadius: project.orbitRadius || 3,
      orbitAngle: project.orbitAngle || 0,
      orbitSpeed: project.orbitSpeed || 0.1,
      
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      planets,
      total: planets.length,
    })
  } catch (error) {
    console.error('获取热门星球失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取热门星球失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
