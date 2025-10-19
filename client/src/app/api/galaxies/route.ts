import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ProjectType } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/galaxies
 * 获取所有用户的星系数据（用户+恒星+行星列表）
 * 
 * 数据来源: 真实的PostgreSQL数据库查询
 * 数据流: API -> Prisma -> PostgreSQL
 */
export async function GET() {
  try {
    // 获取所有用户及其项目，按加入时间排序
    const users = await prisma.user.findMany({
      orderBy: {
        galaxyJoinedAt: 'asc', // 按加入时间排序
      },
      include: {
        projects: {
          where: {
            isActive: true, // 只获取活跃项目
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    // 转换为星系数据结构
    const galaxies = users.map(user => {
      // 找到该用户的恒星项目
      const starProject = user.projects.find(
        p => p.projectType === ProjectType.STAR
      )

      // 找到所有行星项目
      const planetProjects = user.projects.filter(
        p => p.projectType === ProjectType.PLANET
      )

      return {
        userId: user.id,
        userName: user.name || 'Unknown',
        userEmail: user.email,
        userAvatar: user.avatar,
        galaxyCenter: {
          x: user.galaxyX || 0,
          y: user.galaxyY || 0,
          z: user.galaxyZ || 0,
        },
        joinedAt: user.galaxyJoinedAt.toISOString(),
        
        // 恒星项目（个人介绍）
        star: starProject ? {
          id: starProject.id,
          title: starProject.title,
          description: starProject.description,
          category: starProject.category,
          tags: starProject.tags,
          userBio: starProject.userBio,
          userTitle: starProject.userTitle,
          userSkills: starProject.userSkills,
          socialLinks: starProject.socialLinks,
          viewCount: starProject.viewCount,
          likeCount: starProject.likeCount,
          createdAt: starProject.createdAt.toISOString(),
          updatedAt: starProject.updatedAt.toISOString(),
        } : null,

        // 行星项目（AI工具）
        planets: planetProjects.map(project => ({
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
          
          // 轨道参数
          orbitRadius: project.orbitRadius || 3,
          orbitAngle: project.orbitAngle || 0,
          orbitSpeed: project.orbitSpeed || 0.1,
          
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        })),
      }
    })

    return NextResponse.json({
      success: true,
      galaxies,
      total: galaxies.length,
    })
  } catch (error) {
    console.error('获取星系列表失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取星系列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

