import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProjectType } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/projects/star
 * 获取当前用户的恒星项目
 * 
 * 数据来源: 真实的PostgreSQL数据库查询
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 查找该用户的恒星项目
    const starProject = await prisma.project.findFirst({
      where: {
        authorId: user.id,
        projectType: ProjectType.STAR,
      },
    })

    return NextResponse.json({
      success: true,
      star: starProject,
    })
  } catch (error) {
    console.error('获取恒星项目失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取恒星项目失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/star
 * 创建或更新恒星项目（用户个人介绍）
 * 
 * 数据来源: 用户输入的真实数据
 * 数据流: 前端表单 -> API -> Prisma -> PostgreSQL
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const {
      title,
      description,
      userBio,
      userTitle,
      userSkills,
      socialLinks,
    } = body

    // 验证必填字段
    if (!title || !description) {
      return NextResponse.json(
        { error: '标题和描述不能为空' },
        { status: 400 }
      )
    }

    // 检查是否已存在恒星项目
    const existingStar = await prisma.project.findFirst({
      where: {
        authorId: user.id,
        projectType: ProjectType.STAR,
      },
    })

    let starProject

    if (existingStar) {
      // 更新现有恒星项目
      starProject = await prisma.project.update({
        where: { id: existingStar.id },
        data: {
          title,
          description,
          userBio: userBio || null,
          userTitle: userTitle || null,
          userSkills: userSkills || [],
          socialLinks: socialLinks || null,
          updatedAt: new Date(),
        },
      })
    } else {
      // 创建新的恒星项目
      starProject = await prisma.project.create({
        data: {
          title,
          description,
          category: '个人介绍',
          tags: [],
          projectType: ProjectType.STAR,
          userBio: userBio || null,
          userTitle: userTitle || null,
          userSkills: userSkills || [],
          socialLinks: socialLinks || null,
          isActive: true,
          authorId: user.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      star: starProject,
      message: existingStar ? '恒星项目更新成功' : '恒星项目创建成功',
    })
  } catch (error) {
    console.error('创建/更新恒星项目失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '创建/更新恒星项目失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/star
 * 删除恒星项目
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 查找并删除恒星项目
    const starProject = await prisma.project.findFirst({
      where: {
        authorId: user.id,
        projectType: ProjectType.STAR,
      },
    })

    if (!starProject) {
      return NextResponse.json(
        { error: '恒星项目不存在' },
        { status: 404 }
      )
    }

    await prisma.project.delete({
      where: { id: starProject.id },
    })

    return NextResponse.json({
      success: true,
      message: '恒星项目删除成功',
    })
  } catch (error) {
    console.error('删除恒星项目失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '删除恒星项目失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

