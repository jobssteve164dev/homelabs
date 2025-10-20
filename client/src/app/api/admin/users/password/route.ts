import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { validateRequest, passwordSchema } from "@/lib/validation";
import { adminRateLimit, checkRateLimit } from "@/lib/ratelimit";
import { logError, logSecurityEvent } from "@/lib/logger";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const rateLimitResponse = await checkRateLimit(request, adminRateLimit);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { userId, newPassword } = body ?? {};
    if (!userId || !newPassword) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }
    if (userId === session.user.id) {
      return NextResponse.json({ error: "不能通过此接口修改自己的密码" }, { status: 400 });
    }

    const valid = validateRequest(passwordSchema, newPassword);
    if (!valid.success) {
      return NextResponse.json({ error: valid.error }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    logSecurityEvent("Admin reset user password", { adminId: session.user.id, targetUserId: userId });
    return NextResponse.json({ message: "用户密码已重置" });
  } catch (error) {
    logError("管理员重置密码错误", error);
    return NextResponse.json({ error: "服务器内部错误,请稍后重试" }, { status: 500 });
  }
}


