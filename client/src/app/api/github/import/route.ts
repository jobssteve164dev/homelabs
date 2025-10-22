import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { importGitHubProjects } from '@/lib/github';
import { ProjectType } from '@prisma/client';
import type { AuthSession } from '@/types/auth';

/**
 * POST /api/github/import
 * 从GitHub导入用户的AI相关项目并自动创建行星
 * 
 * 数据来源: GitHub公开API (无需token)
 * 数据流: 前端 -> API -> GitHub API -> 数据库批量创建
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AuthSession | null;
    
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const body = await request.json();
    const { githubUrl } = body;

    if (!githubUrl || typeof githubUrl !== 'string') {
      return NextResponse.json({ error: "请提供有效的GitHub URL" }, { status: 400 });
    }

    // 1. 调用GitHub API获取并过滤AI项目
    let importResult;
    try {
      importResult = await importGitHubProjects(githubUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GitHub API调用失败';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // 2. 如果没有找到AI项目
    if (importResult.projects.length === 0) {
      return NextResponse.json({
        message: "未找到AI相关项目",
        result: {
          imported: 0,
          skipped: 0,
          failed: 0,
          total: importResult.total,
          details: "在该用户的仓库中未检测到AI相关关键词"
        }
      }, { status: 200 });
    }

    // 3. 获取该用户现有的所有行星项目
    const existingPlanets = await prisma.project.findMany({
      where: {
        authorId: session.user.id,
        projectType: 'PLANET',
        orbitRadius: { not: null }
      },
      select: {
        orbitRadius: true,
        githubUrl: true,
        title: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // 4. 提取已使用的轨道和已存在的GitHub URL
    const existingOrbits = existingPlanets
      .map((p: { orbitRadius: number | null }) => p.orbitRadius)
      .filter((r): r is number => r !== null);
    
    const existingGithubUrls = new Set(
      existingPlanets
        .map((p: { githubUrl: string | null }) => p.githubUrl)
        .filter((url): url is string => url !== null)
    );

    const existingTitles = new Set(existingPlanets.map((p: { title: string }) => p.title));

    // 5. 计算星系偏移
    const allUsers = await prisma.user.findMany({
      orderBy: {
        galaxyJoinedAt: 'asc'
      },
      select: { id: true }
    });
    
    const userIndex = allUsers.findIndex((u: { id: string }) => u.id === session.user.id);
    const galaxyOffset = userIndex >= 0 ? userIndex * 60 : 0;

    // 6. 准备批量创建数据（过滤重复项）
    const projectsToCreate: Array<{
      title: string;
      description: string;
      category: string;
      tags: string[];
      githubUrl: string;
      demoUrl?: string;
      projectType: ProjectType;
      orbitRadius: number;
      orbitAngle: number;
      orbitSpeed: number;
      authorId: string;
      githubCreatedAt: string;
      githubUpdatedAt: string;
    }> = [];
    const skippedProjects: Array<{ title: string; reason: string }> = [];
    
    // 修复：从最大轨道半径开始分配，而不是从行星数量
    const baseOrbitRadius = 4;
    const orbitGap = 3.0;
    const maxExistingOrbit = existingOrbits.length > 0 ? Math.max(...existingOrbits) : 0;
    let nextOrbitRadius = maxExistingOrbit > 0 ? maxExistingOrbit + orbitGap : baseOrbitRadius;

    for (const project of importResult.projects) {
      // 检查是否已存在相同GitHub URL或标题
      if (existingGithubUrls.has(project.githubUrl) || existingTitles.has(project.title)) {
        skippedProjects.push({
          title: project.title,
          reason: '项目已存在'
        });
        continue;
      }

      // 计算轨道参数（确保不与现有轨道冲突）
      while (existingOrbits.some(r => Math.abs(r - nextOrbitRadius) < 0.5)) {
        nextOrbitRadius += orbitGap;
      }

      // 计算角度和速度
      const planetIndex: number = existingPlanets.length + projectsToCreate.length;
      const goldenAngle: number = 137.508;
      const planetAngle: number = (planetIndex * goldenAngle) % 360;
      const totalAngle: number = (planetAngle + galaxyOffset) % 360;
      const angle: number = totalAngle * (Math.PI / 180);
      const speed: number = 0.2 / Math.sqrt(nextOrbitRadius);

      existingOrbits.push(nextOrbitRadius); // 添加到已使用轨道列表

      projectsToCreate.push({
        title: project.title,
        description: project.description,
        category: project.category,
        tags: project.tags,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        projectType: 'PLANET' as ProjectType,
        orbitRadius: nextOrbitRadius,
        orbitAngle: angle,
        orbitSpeed: speed,
        authorId: session.user.id,
        // 保存GitHub时间戳用于后续创建
        githubCreatedAt: project.githubCreatedAt,
        githubUpdatedAt: project.githubUpdatedAt,
      });

      // 为下一个行星准备轨道
      nextOrbitRadius += orbitGap;
    }

    // 7. 批量创建项目
    let createdCount = 0;
    if (projectsToCreate.length > 0) {
      // 由于Prisma的createMany不支持自定义时间戳，我们需要逐个创建
      const createdProjects = [];
      for (const projectData of projectsToCreate) {
        const { githubCreatedAt, githubUpdatedAt, ...restData } = projectData;
        const project = await prisma.project.create({
          data: {
            ...restData,
            createdAt: new Date(githubCreatedAt),
            updatedAt: new Date(githubUpdatedAt),
          },
        });
        createdProjects.push(project);
      }
      createdCount = createdProjects.length;
    }

    // 8. 返回结果
    return NextResponse.json({
      message: "GitHub项目导入完成",
      result: {
        imported: createdCount,
        skipped: skippedProjects.length,
        failed: importResult.projects.length - createdCount - skippedProjects.length,
        total: importResult.total,
        aiProjects: importResult.aiProjects,
        details: skippedProjects.length > 0 ? `跳过${skippedProjects.length}个已存在的项目` : undefined
      }
    }, { status: 201 });

  } catch (error) {
    console.error('GitHub项目导入错误:', error);
    return NextResponse.json(
      { error: "服务器内部错误，请稍后重试" },
      { status: 500 }
    );
  }
}

