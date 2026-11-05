# Stage 1: Build workspace dependencies, web static bundle, and Fastify server
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY apps/server ./apps/server

RUN pnpm --filter @chat-me/shared build && \
    pnpm --filter @chat-me/web build && \
    pnpm --filter @chat-me/server build && \
    pnpm --filter @chat-me/server --prod deploy --legacy /prod/server

# Stage 2: Optimized Node.js Alpine unified runtime (Static SPA + Fastify Server + Socket.IO)
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
ENV SERVE_STATIC_WEB=true
ENV STATIC_WEB_DIR=/app/web/dist
ENV STORAGE_MODE=local
ENV STORAGE_LOCAL_DIR=/app/uploads
ENV REDIS_URL=none
ENV AUTO_MIGRATE=true

# Copy deployed production server
COPY --from=builder --chown=node:node /prod/server ./
# Copy built static frontend SPA
COPY --from=builder --chown=node:node /app/apps/web/dist ./web/dist
# Copy migrations directory for Drizzle auto-migration
COPY --from=builder --chown=node:node /app/apps/server/drizzle ./drizzle

# Create local storage uploads directory with correct permissions
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
