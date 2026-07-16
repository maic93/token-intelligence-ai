# Changelog

## v0.1.0 (2026-07-16)

### Features

- **Multi-chain Indexing** — Automatic ERC-20 detection across Base, Ethereum, Polygon, and Robinhood Chain with independent per-chain workers
- **Production REST API** — Paginated token lists, per-token lookup, platform statistics, chain status, and analytics reports
- **Real-time Dashboard** — React 19 + Vite 6 dark-theme UI with WebSocket live token streaming
- **Analytics Engine** — Token, holder, liquidity, transaction, deployer, and chain analytics with Redis caching
- **Structured Logging** — JSON in production, pretty-print in development, log levels, request ID propagation
- **Prometheus Metrics** — HTTP request count/duration, indexed tokens, WebSocket clients, Redis cache hit/miss
- **Security Hardening** — Helmet headers, configurable rate limiting, CORS, trusted proxy, X-Powered-By disabled
- **Graceful Shutdown** — Sequential close of HTTP server, Redis, WebSocket, and Prisma connections

### Architecture

- **Monorepo** — pnpm workspaces with TypeScript project references
- **Modular Packages** — blockchain, config, database (Prisma), shared (logger), analytics
- **Multi-stage Docker** — Separate deps, build, and runner stages with pnpm cache optimization
- **Docker Compose** — PostgreSQL, Redis, indexer, and API services with healthchecks

### Deployment

- Docker Compose for local and VPS deployment
- Vercel-ready dashboard configuration (`vercel.json`)
- GitHub Actions CI pipeline (lint, typecheck, build)
- Production Compose file with configurable environment variables
- Environment template with documented sections

### Known Limitations

- Token holders, liquidity, and transaction analytics return placeholder values — full data requires an archive node or indexer plugin
- Deployer analytics are limited to tokens already discovered by the indexer
- No authentication or API key support yet
- No persistent volume for Redis (data resets on restart)
- AI risk analysis is not yet implemented
