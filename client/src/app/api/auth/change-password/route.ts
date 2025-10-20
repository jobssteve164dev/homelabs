import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { validateRequest, passwordSchema } from "@/lib/validation";
import { apiRateLimit, checkRateLimit } from "@/lib/ratelimit";
import { logError, logSecurityEvent } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const rateLimitResponse = await checkRateLimit(request, apiRateLimit);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { currentPassword, newPassword } = body ?? {};

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const valid = validateRequest(passwordSchema, newPassword);
    if (!valid.success) {
      return NextResponse.json({ error: valid.error }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      logSecurityEvent("Password change failed: wrong current password", { userId: session.user.id });
      return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    logSecurityEvent("Password changed", { userId: session.user.id });
    return NextResponse.json({ message: "密码已更新" });
  } catch (error) {
    logError("修改密码错误", error);
    return NextResponse.json({ error: "服务器内部错误,请稍后重试" }, { status: 500 });
  }
}


