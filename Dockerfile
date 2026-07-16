FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ---- deps: install all dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/indexer/package.json apps/indexer/
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/ai/package.json packages/ai/
COPY packages/analytics/package.json packages/analytics/
COPY packages/blockchain/package.json packages/blockchain/
COPY packages/config/package.json packages/config/
COPY packages/database/package.json packages/database/
COPY packages/database/prisma/schema.prisma packages/database/prisma/schema.prisma
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile

# ---- build: compile all packages ----
FROM deps AS build
COPY apps/ apps/
COPY packages/ packages/
RUN rm -rf apps/*/node_modules packages/*/node_modules 2>/dev/null; pnpm install --frozen-lockfile
RUN pnpm build
RUN rm -rf apps/*/node_modules packages/*/node_modules

# ---- runner-indexer: default target ----
FROM node:22-alpine AS runner
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=build /app .
COPY apps/indexer/bin/start.sh ./bin/start.sh
RUN chmod +x /app/bin/start.sh && chown -R node:node /app
USER node
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD ps aux | grep -v grep | grep -q "node" || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/bin/start.sh"]

# ---- runner-api: API service target ----
FROM node:22-alpine AS runner-api
RUN apk add --no-cache tini curl
WORKDIR /app
COPY --from=build /app .
COPY apps/api/bin/start.sh ./bin/start.sh
RUN chmod +x /app/bin/start.sh && chown -R node:node /app
USER node
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/bin/start.sh"]
