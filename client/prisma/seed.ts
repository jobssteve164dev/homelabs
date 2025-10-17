import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始种子数据初始化...')

  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@homelabs.com' },
    update: {},
    create: {
      email: 'admin@homelabs.com',
      name: '系统管理员',
      password: hashedPassword,
      role: 'ADMIN',
      avatar: null,
    },
  })

  console.log('✅ 管理员用户创建成功:', adminUser.email)

  // 创建示例AI工具项目
  const sampleProjects = [
    {
      title: 'AI文本生成器',
      description: '基于GPT的智能文本生成工具，支持多种写作场景和风格定制',
      category: '文本处理',
      tags: ['GPT', '文本生成', 'AI写作'],
      demoUrl: 'https://demo.example.com/text-generator',
      githubUrl: 'https://github.com/homelabs/text-generator',
      imageUrl: '/images/text-generator.jpg',
      authorId: adminUser.id,
    },
    {
      title: '智能图像识别',
      description: '高精度图像识别系统，支持物体检测、人脸识别和场景分析',
      category: '图像处理',
      tags: ['计算机视觉', '图像识别', '深度学习'],
      demoUrl: 'https://demo.example.com/image-recognition',
      githubUrl: 'https://github.com/homelabs/image-recognition',
      imageUrl: '/images/image-recognition.jpg',
      authorId: adminUser.id,
    },
    {
      title: '语音转文字工具',
      description: '实时语音识别和转录服务，支持多语言和方言识别',
      category: '语音处理',
      tags: ['语音识别', 'ASR', '实时转录'],
      demoUrl: 'https://demo.example.com/speech-to-text',
      githubUrl: 'https://github.com/homelabs/speech-to-text',
      imageUrl: '/images/speech-to-text.jpg',
      authorId: adminUser.id,
    },
    {
      title: '代码智能助手',
      description: 'AI驱动的代码生成和优化工具，支持多种编程语言',
      category: '开发工具',
      tags: ['代码生成', '编程助手', 'AI开发'],
      demoUrl: 'https://demo.example.com/code-assistant',
      githubUrl: 'https://github.com/homelabs/code-assistant',
      imageUrl: '/images/code-assistant.jpg',
      authorId: adminUser.id,
    },
    {
      title: '数据分析平台',
      description: '智能数据分析和可视化平台，支持多种数据源和图表类型',
      category: '数据分析',
      tags: ['数据分析', '可视化', 'BI'],
      demoUrl: 'https://demo.example.com/data-analytics',
      githubUrl: 'https://github.com/homelabs/data-analytics',
      imageUrl: '/images/data-analytics.jpg',
      authorId: adminUser.id,
    },
    {
      title: '智能客服机器人',
      description: '基于NLP的智能客服系统，支持多轮对话和情感分析',
      category: '对话系统',
      tags: ['NLP', '对话系统', '客服机器人'],
      demoUrl: 'https://demo.example.com/chatbot',
      githubUrl: 'https://github.com/homelabs/chatbot',
      imageUrl: '/images/chatbot.jpg',
      authorId: adminUser.id,
    },
  ]

  for (const projectData of sampleProjects) {
    const existingProject = await prisma.project.findFirst({
      where: {
        title: projectData.title,
        authorId: projectData.authorId,
      }
    })

    if (!existingProject) {
      const project = await prisma.project.create({
        data: projectData,
      })
      console.log('✅ 项目创建成功:', project.title)
    } else {
      console.log('⏭️  项目已存在:', projectData.title)
    }
  }

  // 创建普通用户
  const userPassword = await bcrypt.hash('user123', 12)
  
  const normalUser = await prisma.user.upsert({
    where: { email: 'user@homelabs.com' },
    update: {},
    create: {
      email: 'user@homelabs.com',
      name: '普通用户',
      password: userPassword,
      role: 'USER',
      avatar: null,
    },
  })

  console.log('✅ 普通用户创建成功:', normalUser.email)

  console.log('🎉 种子数据初始化完成!')
  console.log('📧 管理员账号: admin@homelabs.com / admin123')
  console.log('📧 普通用户: user@homelabs.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
