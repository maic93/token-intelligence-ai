FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/indexer/package.json apps/indexer/
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/ai/package.json packages/ai/
COPY packages/analytics/package.json packages/analytics/
COPY packages/blockchain/package.json packages/blockchain/
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY packages/database/prisma/schema.prisma packages/database/prisma/schema.prisma
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
COPY --from=build /app .
COPY apps/indexer/bin/migrate-and-start.sh ./bin/migrate-and-start.sh
RUN chmod +x /app/bin/migrate-and-start.sh
ENV NODE_ENV=production
ENTRYPOINT ["/app/bin/migrate-and-start.sh"]
CMD ["node", "apps/indexer/dist/index.js"]
