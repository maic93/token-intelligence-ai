FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM base AS runner
WORKDIR /app
COPY --from=build /app .
COPY apps/indexer/bin/start.sh ./bin/start.sh
RUN chmod +x /app/bin/start.sh
ENV NODE_ENV=production
CMD ["/app/bin/start.sh"]
