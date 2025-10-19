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

    // 创建用户 (使用安全选择器)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "USER"
      },
      select: userSelectPublic, // 使用统一选择器,自动排除密码
    });

    return NextResponse.json(
      { 
        message: "注册成功", 
        user 
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
