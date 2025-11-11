# 科幻未来风私域AI工具门户网站 - Docker配置
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1

# 复制package文件
COPY client/package*.json ./
RUN npm ci --only=production --ignore-scripts

# 构建应用
FROM base AS builder
WORKDIR /app
COPY client/package*.json ./
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1
RUN npm ci --ignore-scripts

COPY client/ ./
RUN npx prisma generate
RUN npm run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
