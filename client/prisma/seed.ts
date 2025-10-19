import { PrismaClient, ProjectType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * 计算用户星系的3D坐标
 * 基于用户索引，使用阿基米德螺旋线在3D球面上分布
 */
function calculateGalaxyPosition(userIndex: number): { x: number; y: number; z: number } {
  const baseRadius = 20  // 基础半径
  const spiralGrowth = 3 // 螺旋增长系数
  const verticalSpread = 10 // 垂直分布范围
  
  // 阿基米德螺旋: r = a + b * θ
  const theta = userIndex * (Math.PI * 2 / 5) // 每5个用户转一圈
  const radius = baseRadius + spiralGrowth * userIndex
  
  // 3D坐标
  const x = radius * Math.cos(theta)
  const z = radius * Math.sin(theta)
  const y = (userIndex % 3 - 1) * verticalSpread // 三层垂直分布
  
  return { x, y, z }
}

/**
 * 计算行星的轨道参数
 * 确保每个行星都在独立的轨道上，不会重叠
 * 
 * @param planetIndex 行星在该星系中的索引（0, 1, 2...）
 * @param existingOrbits 已使用的轨道半径数组
 * @param galaxyOffset 星系的角度偏移（用于让不同星系的行星初始角度不同）
 */
function calculatePlanetOrbit(planetIndex: number, existingOrbits: number[] = [], galaxyOffset: number = 0) {
  const baseOrbitRadius = 4   // 第一个行星的轨道半径（增加基础距离）
  const orbitGap = 3.0         // 轨道间距（从1.5增加到3.0，确保足够安全距离）
  
  // 计算候选轨道半径
  let radius = baseOrbitRadius + planetIndex * orbitGap
  
  // 确保轨道半径唯一（不与现有轨道冲突）
  const tolerance = 0.5 // 轨道半径容差（从0.1增加到0.5，防止轨道重叠）
  let attempts = 0
  while (attempts < 50) {
    const hasConflict = existingOrbits.some(existingRadius => 
      Math.abs(existingRadius - radius) < tolerance
    )
    
    if (!hasConflict) {
      break
    }
    
    // 如果有冲突，尝试下一个轨道
    attempts++
    radius = baseOrbitRadius + (planetIndex + attempts) * orbitGap
  }
  
  // 智能角度分配：使用改进的黄金角分布，确保初始相位差
  const goldenAngle = 137.508 // 黄金角（度）
  const planetAngle = (planetIndex * goldenAngle) % 360
  const totalAngle = (planetAngle + galaxyOffset) % 360
  const angle = totalAngle * (Math.PI / 180) // 转换为弧度
  
  // 智能公转速度：基于轨道半径和碰撞避免算法
  const speed = calculateCollisionAvoidingSpeed(radius, planetIndex, existingOrbits)
  
  return {
    radius,
    angle,
    speed
  }
}

/**
 * 计算避免碰撞的公转速度
 * 通过精心选择速度比例，确保行星间保持安全的相位差
 */
function calculateCollisionAvoidingSpeed(
  radius: number, 
  planetIndex: number, 
  existingOrbits: number[]
): number {
  // 基础速度：遵循开普勒第三定律（内圈快，外圈慢）
  const baseSpeed = 0.2 / Math.sqrt(radius)
  
  // 如果这是第一个行星，使用基础速度
  if (planetIndex === 0) {
    return baseSpeed
  }
  
  // 为后续行星计算避免碰撞的速度
  // 使用无理数比例确保行星间不会形成简单的整数比例关系
  const irrationalMultipliers = [
    1.0,           // 第1个行星：基础速度
    1.6180339887,  // 第2个行星：黄金比例
    2.4142135623,  // 第3个行星：√2 + 1
    3.1415926535,  // 第4个行星：π
    4.2360679774,  // 第5个行星：2 + √5
    5.8284271247,  // 第6个行星：3 + 2√2
    7.4641016151,  // 第7个行星：4 + 2√3
    9.1622776601,  // 第8个行星：5 + 2√5
  ]
  
  // 选择对应的无理数乘数
  const multiplier = irrationalMultipliers[planetIndex] || (planetIndex * 1.4142135623)
  
  // 计算最终速度，确保与内圈行星保持安全相位差
  let finalSpeed = baseSpeed * multiplier
  
  // 速度限制：确保不会太快或太慢
  const minSpeed = 0.01  // 最小速度
  const maxSpeed = 0.5   // 最大速度
  
  finalSpeed = Math.max(minSpeed, Math.min(maxSpeed, finalSpeed))
  
  return finalSpeed
}

async function main() {
  console.log('🌱 开始种子数据初始化...')

  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const galaxyPos1 = calculateGalaxyPosition(0)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@homelabs.com' },
    update: {
      galaxyX: galaxyPos1.x,
      galaxyY: galaxyPos1.y,
      galaxyZ: galaxyPos1.z,
    },
    create: {
      email: 'admin@homelabs.com',
      name: '系统管理员',
      password: hashedPassword,
      role: 'ADMIN',
      avatar: null,
      galaxyX: galaxyPos1.x,
      galaxyY: galaxyPos1.y,
      galaxyZ: galaxyPos1.z,
      galaxyJoinedAt: new Date('2025-01-01T00:00:00Z'),
    },
  })

  console.log('✅ 管理员用户创建成功:', adminUser.email)
  console.log(`   星系坐标: (${galaxyPos1.x.toFixed(2)}, ${galaxyPos1.y.toFixed(2)}, ${galaxyPos1.z.toFixed(2)})`)

  // 为管理员创建恒星项目（个人介绍）
  const adminStar = await prisma.project.upsert({
    where: {
      title_authorId: {
        title: '系统管理员的星系',
        authorId: adminUser.id,
      }
    },
    update: {},
    create: {
      title: '系统管理员的星系',
      description: 'HOMELABS AI宇宙门户的创建者和管理者',
      category: '个人介绍',
      tags: ['管理员', '创始人', '全栈开发'],
      projectType: ProjectType.STAR,
      userBio: '热爱AI技术，致力于打造最具沉浸感的AI工具展示平台。擅长全栈开发、3D可视化和系统架构设计。',
      userTitle: '首席架构师 & 创始人',
      userSkills: ['React', 'Next.js', 'Three.js', 'Node.js', 'PostgreSQL', 'AI/ML', '系统架构', '3D可视化'],
      socialLinks: {
        github: 'https://github.com/homelabs',
        linkedin: 'https://linkedin.com/in/homelabs',
        twitter: 'https://twitter.com/homelabs',
        website: 'https://homelabs.ai'
      },
      isActive: true,
      authorId: adminUser.id,
    },
  })

  console.log('⭐ 恒星项目创建成功:', adminStar.title)

  // 创建示例AI工具项目（作为管理员星系的行星）
  const sampleProjects = [
    {
      title: 'AI文本生成器',
      description: '基于GPT的智能文本生成工具，支持多种写作场景和风格定制',
      category: '文本处理',
      tags: ['GPT', '文本生成', 'AI写作'],
      demoUrl: 'https://demo.example.com/text-generator',
      githubUrl: 'https://github.com/homelabs/text-generator',
      imageUrl: '/images/text-generator.jpg',
    },
    {
      title: '智能图像识别',
      description: '高精度图像识别系统，支持物体检测、人脸识别和场景分析',
      category: '图像处理',
      tags: ['计算机视觉', '图像识别', '深度学习'],
      demoUrl: 'https://demo.example.com/image-recognition',
      githubUrl: 'https://github.com/homelabs/image-recognition',
      imageUrl: '/images/image-recognition.jpg',
    },
    {
      title: '语音转文字工具',
      description: '实时语音识别和转录服务，支持多语言和方言识别',
      category: '语音处理',
      tags: ['语音识别', 'ASR', '实时转录'],
      demoUrl: 'https://demo.example.com/speech-to-text',
      githubUrl: 'https://github.com/homelabs/speech-to-text',
      imageUrl: '/images/speech-to-text.jpg',
    },
    {
      title: '代码智能助手',
      description: 'AI驱动的代码生成和优化工具，支持多种编程语言',
      category: '开发工具',
      tags: ['代码生成', '编程助手', 'AI开发'],
      demoUrl: 'https://demo.example.com/code-assistant',
      githubUrl: 'https://github.com/homelabs/code-assistant',
      imageUrl: '/images/code-assistant.jpg',
    },
    {
      title: '数据分析平台',
      description: '智能数据分析和可视化平台，支持多种数据源和图表类型',
      category: '数据分析',
      tags: ['数据分析', '可视化', 'BI'],
      demoUrl: 'https://demo.example.com/data-analytics',
      githubUrl: 'https://github.com/homelabs/data-analytics',
      imageUrl: '/images/data-analytics.jpg',
    },
    {
      title: '智能客服机器人',
      description: '基于NLP的智能客服系统，支持多轮对话和情感分析',
      category: '对话系统',
      tags: ['NLP', '对话系统', '客服机器人'],
      demoUrl: 'https://demo.example.com/chatbot',
      githubUrl: 'https://github.com/homelabs/chatbot',
      imageUrl: '/images/chatbot.jpg',
    },
  ]

  // 跟踪已使用的轨道半径，确保不重叠
  const usedOrbits: number[] = []
  const adminGalaxyOffset = 0 // 管理员星系的角度偏移
  
  for (let i = 0; i < sampleProjects.length; i++) {
    const projectData = sampleProjects[i]
    const orbit = calculatePlanetOrbit(i, usedOrbits, adminGalaxyOffset)
    
    const existingProject = await prisma.project.findFirst({
      where: {
        title: projectData.title,
        authorId: adminUser.id,
      }
    })

    if (!existingProject) {
      const project = await prisma.project.create({
        data: {
          ...projectData,
          projectType: ProjectType.PLANET,
          orbitRadius: orbit.radius,
          orbitAngle: orbit.angle,
          orbitSpeed: orbit.speed,
          authorId: adminUser.id,
        },
      })
      usedOrbits.push(orbit.radius) // 记录已使用的轨道
      console.log(`🪐 行星项目创建成功: ${project.title} (轨道半径: ${orbit.radius.toFixed(2)}, 角度: ${(orbit.angle * 180 / Math.PI).toFixed(1)}°)`)
    } else {
      // 更新现有项目的轨道参数
      await prisma.project.update({
        where: { id: existingProject.id },
        data: {
          projectType: ProjectType.PLANET,
          orbitRadius: orbit.radius,
          orbitAngle: orbit.angle,
          orbitSpeed: orbit.speed,
        }
      })
      usedOrbits.push(orbit.radius) // 记录已使用的轨道
      console.log(`⏭️  项目已存在（已更新轨道参数）: ${projectData.title} (轨道: ${orbit.radius.toFixed(2)}, 角度: ${(orbit.angle * 180 / Math.PI).toFixed(1)}°)`)
    }
  }

  // 创建普通用户
  const userPassword = await bcrypt.hash('user123', 12)
  const galaxyPos2 = calculateGalaxyPosition(1)
  
  const normalUser = await prisma.user.upsert({
    where: { email: 'user@homelabs.com' },
    update: {
      galaxyX: galaxyPos2.x,
      galaxyY: galaxyPos2.y,
      galaxyZ: galaxyPos2.z,
    },
    create: {
      email: 'user@homelabs.com',
      name: '张三',
      password: userPassword,
      role: 'USER',
      avatar: null,
      galaxyX: galaxyPos2.x,
      galaxyY: galaxyPos2.y,
      galaxyZ: galaxyPos2.z,
      galaxyJoinedAt: new Date('2025-01-15T10:30:00Z'),
    },
  })

  console.log('✅ 普通用户创建成功:', normalUser.email)
  console.log(`   星系坐标: (${galaxyPos2.x.toFixed(2)}, ${galaxyPos2.y.toFixed(2)}, ${galaxyPos2.z.toFixed(2)})`)

  // 为普通用户创建恒星项目
  const userStar = await prisma.project.upsert({
    where: {
      title_authorId: {
        title: '张三的个人星系',
        authorId: normalUser.id,
      }
    },
    update: {},
    create: {
      title: '张三的个人星系',
      description: '一位热爱AI和前端技术的开发者',
      category: '个人介绍',
      tags: ['前端开发', 'AI爱好者', 'React'],
      projectType: ProjectType.STAR,
      userBio: '5年前端开发经验，专注于React生态和AI应用开发。喜欢探索新技术，热衷于开源贡献。',
      userTitle: '高级前端工程师',
      userSkills: ['React', 'TypeScript', 'Vue.js', 'Node.js', 'Tailwind CSS', 'AI集成'],
      socialLinks: {
        github: 'https://github.com/zhangsan',
        blog: 'https://zhangsan.dev'
      },
      isActive: true,
      authorId: normalUser.id,
    },
  })

  console.log('⭐ 恒星项目创建成功:', userStar.title)

  // 为普通用户创建几个行星项目
  const userProjects = [
    {
      title: 'React组件库',
      description: '一套精美的React UI组件库，支持暗黑模式和主题定制',
      category: '开发工具',
      tags: ['React', 'UI组件', '组件库'],
      githubUrl: 'https://github.com/zhangsan/react-components',
    },
    {
      title: 'AI聊天助手',
      description: '基于GPT的智能聊天助手，支持上下文理解和个性化回复',
      category: '对话系统',
      tags: ['GPT', '聊天机器人', 'AI'],
      demoUrl: 'https://chat.zhangsan.dev',
    },
  ]

  // 跟踪该用户已使用的轨道半径
  const userUsedOrbits: number[] = []
  const userGalaxyOffset = 60 // 普通用户星系的角度偏移（与管理员区分）
  
  for (let i = 0; i < userProjects.length; i++) {
    const projectData = userProjects[i]
    const orbit = calculatePlanetOrbit(i, userUsedOrbits, userGalaxyOffset)
    
    const existingProject = await prisma.project.findFirst({
      where: {
        title: projectData.title,
        authorId: normalUser.id,
      }
    })

    if (!existingProject) {
      const project = await prisma.project.create({
        data: {
          ...projectData,
          projectType: ProjectType.PLANET,
          orbitRadius: orbit.radius,
          orbitAngle: orbit.angle,
          orbitSpeed: orbit.speed,
          authorId: normalUser.id,
        },
      })
      userUsedOrbits.push(orbit.radius)
      console.log(`🪐 行星项目创建成功: ${project.title} (轨道半径: ${orbit.radius.toFixed(2)}, 角度: ${(orbit.angle * 180 / Math.PI).toFixed(1)}°)`)
    } else {
      // 更新现有项目的轨道参数
      await prisma.project.update({
        where: { id: existingProject.id },
        data: {
          projectType: ProjectType.PLANET,
          orbitRadius: orbit.radius,
          orbitAngle: orbit.angle,
          orbitSpeed: orbit.speed,
        }
      })
      userUsedOrbits.push(orbit.radius)
      console.log(`⏭️  项目已存在（已更新轨道参数）: ${projectData.title} (轨道: ${orbit.radius.toFixed(2)}, 角度: ${(orbit.angle * 180 / Math.PI).toFixed(1)}°)`)
    }
  }

  // 修复所有没有轨道参数的行星项目
  console.log('\n🔧 检查并修复轨道参数...')
  
  const allUsers = await prisma.user.findMany({
    include: {
      projects: {
        where: {
          projectType: ProjectType.PLANET
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    },
    orderBy: {
      galaxyJoinedAt: 'asc'
    }
  })
  
  for (let userIndex = 0; userIndex < allUsers.length; userIndex++) {
    const user = allUsers[userIndex]
    const planetsWithoutOrbits = user.projects.filter(p => 
      p.orbitRadius === null || p.orbitAngle === null || p.orbitSpeed === null
    )
    
    if (planetsWithoutOrbits.length > 0) {
      console.log(`\n🔍 发现用户 ${user.name} 有 ${planetsWithoutOrbits.length} 个行星需要修复`)
      
      // 获取该用户所有行星的轨道，用于冲突检测
      const existingOrbits = user.projects
        .filter(p => p.orbitRadius !== null)
        .map(p => p.orbitRadius as number)
      
      // 为每个用户计算不同的星系偏移
      const galaxyOffset = userIndex * 60
      
      for (let i = 0; i < planetsWithoutOrbits.length; i++) {
        const planet = planetsWithoutOrbits[i]
        // 使用该用户现有行星数量作为起始索引
        const planetIndex = user.projects.filter(p => p.orbitRadius !== null).length + i
        const orbit = calculatePlanetOrbit(planetIndex, existingOrbits, galaxyOffset)
        
        await prisma.project.update({
          where: { id: planet.id },
          data: {
            projectType: ProjectType.PLANET,
            orbitRadius: orbit.radius,
            orbitAngle: orbit.angle,
            orbitSpeed: orbit.speed,
          }
        })
        
        existingOrbits.push(orbit.radius)
        console.log(`   ✅ 已修复: ${planet.title} (轨道: ${orbit.radius.toFixed(2)}, 角度: ${(orbit.angle * 180 / Math.PI).toFixed(1)}°)`)
      }
    }
  }

  console.log('\n🎉 种子数据初始化完成!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 管理员账号: admin@homelabs.com / admin123')
  console.log('📧 普通用户: user@homelabs.com / user123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🌌 星系系统已初始化：')
  console.log(`   ⭐ 2个恒星项目（用户个人介绍）`)
  console.log(`   🪐 ${sampleProjects.length + userProjects.length}个行星项目（AI工具）`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
