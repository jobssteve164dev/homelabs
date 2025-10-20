import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { accountUpdateSchema, validateRequest } from "@/lib/validation";
import { apiRateLimit, checkRateLimit } from "@/lib/ratelimit";
import { logError } from "@/lib/logger";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const rateLimitResponse = await checkRateLimit(request, apiRateLimit);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const validated = validateRequest(accountUpdateSchema, body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { name } = validated.data;
    if (!name) {
      return NextResponse.json({ error: "无可更新字段" }, { status: 400 });
    }

    await prisma.user.update({ where: { id: session.user.id }, data: { name } });
    return NextResponse.json({ message: "资料已更新" });
  } catch (error) {
    logError("更新账户资料错误", error);
    return NextResponse.json({ error: "服务器内部错误,请稍后重试" }, { status: 500 });
  }
}


