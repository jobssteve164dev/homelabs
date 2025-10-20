import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema, validateRequest } from "@/lib/validation";
import { userSelectPublic } from "@/lib/select";
import { logError, logSecurityEvent } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 使用Zod验证输入
    const validation = validateRequest(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // 记录安全事件
      logSecurityEvent('Registration attempt with existing email', {
        email,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });
      
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 使用事务创建用户和默认恒星项目
    const result = await prisma.$transaction(async (tx) => {
      // 创建用户
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "USER"
        },
        select: userSelectPublic, // 使用统一选择器,自动排除密码
      });

      // 自动创建恒星项目（个人介绍）
      await tx.project.create({
        data: {
          title: `${name || email.split('@')[0]}的星系`,
          description: '欢迎来到我的AI宇宙！这是我的个人星系，在这里我将分享我的AI工具和创意。',
          category: '个人介绍',
          tags: ['个人介绍', 'AI爱好者'],
          projectType: 'STAR',
          userTitle: 'AI探索者',
          userBio: '🚀 热爱AI技术，探索智能未来',
          userSkills: ['人工智能', '技术创新'],
          socialLinks: {
            email: email
          },
          isActive: true,
          authorId: user.id,
        }
      });

      return user;
    });

    return NextResponse.json(
      { 
        message: "注册成功，您的专属星系已创建！", 
        user: result 
      },
      { status: 201 }
    );
  } catch (error) {
    logError("注册错误", error, {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });
    
    return NextResponse.json(
      { error: "服务器内部错误,请稍后重试" },
      { status: 500 }
    );
  }
}
