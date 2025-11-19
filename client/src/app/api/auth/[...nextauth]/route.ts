import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

// 验证必要的环境变量
if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ 错误: NEXTAUTH_SECRET 环境变量未设置');
  console.error('请在环境变量中设置 NEXTAUTH_SECRET');
}

if (!process.env.NEXTAUTH_URL) {
  console.warn('⚠️  警告: NEXTAUTH_URL 环境变量未设置');
  console.warn('NextAuth可能无法正常工作，请设置 NEXTAUTH_URL');
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
