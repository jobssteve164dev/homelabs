import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { logSecurityEvent, logError } from "./logger";

// 验证环境变量
if (!process.env.NEXTAUTH_SECRET) {
  logError('NEXTAUTH_SECRET未设置', new Error('NEXTAUTH_SECRET环境变量缺失'), {
    component: 'auth',
    severity: 'critical'
  });
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user) {
          // 记录登录失败事件
          logSecurityEvent('Login attempt with non-existent email', {
            email: credentials.email,
          });
          return null;
        }

        // 检查账户是否被冻结
        if (!user.isActive) {
          logSecurityEvent('Login attempt with frozen account', {
            email: credentials.email,
            userId: user.id,
          });
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          // 记录密码错误事件
          logSecurityEvent('Login attempt with invalid password', {
            email: credentials.email,
          });
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60, // 7天过期
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7天过期
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  // NextAuth配置
  secret: process.env.NEXTAUTH_SECRET,
  // Next.js 14推荐配置 - 在反向代理后运行时需要
  trustHost: true,
};
