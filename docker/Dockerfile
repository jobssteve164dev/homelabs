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

# 复制生产依赖（包含 Prisma CLI 所需的全部依赖）
COPY --from=deps /app/node_modules ./node_modules

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制Prisma相关文件（用于数据库迁移）
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
# 复制Prisma CLI可执行文件
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# 复制启动脚本
COPY docker/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 使用启动脚本
ENTRYPOINT ["./docker-entrypoint.sh"]
