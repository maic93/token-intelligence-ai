# Token Intelligence AI

AI-powered blockchain intelligence platform for discovering, tracking, and analyzing newly deployed tokens across EVM networks.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Dashboard   │────▶│     API     │────▶│  PostgreSQL   │
│  (Vite/React)│     │  (Express)  │     │   (Prisma)    │
└─────────────┘     │             │     └──────────────┘
                    │  /health    │     ┌──────────────┐
                    │  /ready     │────▶│    Redis      │
                    │  /metrics   │     │   (Cache/WS)  │
                    │  /api/*     │     └──────────────┘
                    └─────┬───────┘
                          │
                    ┌─────▼───────┐
                    │   Indexer    │
                    │(multi-chain) │
                    └─────────────┘
```

## Prerequisites

- Node.js >= 22
- pnpm >= 9
- Docker & Docker Compose

## Quick Start

```bash
# 1. Clone and enter directory
git clone <repo>
cd token-intelligence-ai

# 2. Copy environment file
cp .env.example .env

# 3. Start infrastructure (PostgreSQL + Redis)
docker compose up -d postgres redis

# 4. Install dependencies
pnpm install

# 5. Build all packages
pnpm build

# 6. Run database migrations
cd packages/database
npx prisma migrate deploy
cd ../..

# 7. Start API (in one terminal)
pnpm --filter @token-intelligence-ai/api dev

# 8. Start Indexer (in another terminal)
pnpm --filter @token-intelligence-ai/indexer dev

# 9. Start Dashboard (in another terminal)
pnpm --filter @token-intelligence-ai/dashboard dev
```

## Docker Deployment

```bash
# Build and start all services
docker compose up --build

# Or start individual services
docker compose up -d postgres redis
docker compose up --build api
docker compose up --build indexer
```

## Environment Variables

### General

| Variable    | Default       | Description                                     |
| ----------- | ------------- | ----------------------------------------------- |
| `NODE_ENV`  | `development` | Runtime environment                             |
| `LOG_LEVEL` | `info`        | Logging level: `debug`, `info`, `warn`, `error` |

### API

| Variable               | Default | Description                                           |
| ---------------------- | ------- | ----------------------------------------------------- |
| `PORT`                 | `4000`  | HTTP server port                                      |
| `DATABASE_URL`         | —       | PostgreSQL connection string                          |
| `REDIS_URL`            | —       | Redis connection string (caching + WebSocket pub/sub) |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in milliseconds                     |
| `RATE_LIMIT_MAX`       | `100`   | Max requests per window                               |
| `CORS_ORIGIN`          | `*`     | CORS origin (comma-separated for multiple)            |

### Indexer

| Variable           | Default | Description                               |
| ------------------ | ------- | ----------------------------------------- |
| `DATABASE_URL`     | —       | PostgreSQL connection string              |
| `START_BLOCK`      | `0`     | Block to start indexing from (0 = latest) |
| `BACKFILL_BLOCKS`  | `0`     | Number of blocks to backfill              |
| `POLL_INTERVAL_MS` | `12000` | Poll interval in milliseconds             |

### Chain RPC URLs

| Variable            | Chain            |
| ------------------- | ---------------- |
| `BASE_RPC_URL`      | Base             |
| `ETHEREUM_RPC_URL`  | Ethereum Mainnet |
| `POLYGON_RPC_URL`   | Polygon          |
| `ROBINHOOD_RPC_URL` | Robinhood Chain  |

Set a chain's RPC URL to enable it. Chains without a configured URL are disabled.

## API Endpoints

### `GET /health`

Returns service health including database and Redis connectivity.

**Response (healthy):** `200 OK`

```json
{
  "status": "healthy",
  "service": "api",
  "version": "0.1.0",
  "uptime": 3600,
  "environment": "production",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-07-16T12:00:00.000Z"
}
```

**Response (degraded):** `503 Service Unavailable`

```json
{
  "status": "degraded",
  "service": "api",
  ...
  "database": "error",
  "redis": "disconnected",
  ...
}
```

### `GET /ready`

Readiness probe for Kubernetes / orchestration.

**Response (ready):** `200 OK`

```json
{
  "ready": true,
  "database": true,
  "redis": true,
  "chainsConfigured": 3,
  "timestamp": "2026-07-16T12:00:00.000Z"
}
```

**Response (not ready):** `503 Service Unavailable`

### `GET /metrics`

Prometheus metrics for monitoring and alerting.

**Metrics exposed:**

- `http_requests_total` (method, route, status_code)
- `http_request_duration_ms` (method, route, status_code) — histogram
- `indexed_tokens_total` — gauge
- `indexed_blocks_total` (chain) — gauge
- `websocket_clients` — gauge
- `redis_cache_hits_total` — counter
- `redis_cache_misses_total` — counter
- Default Node.js metrics (CPU, memory, event loop)

### `GET /api/tokens`

List discovered tokens with pagination and chain filtering.

**Query parameters:**

- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `chain` (optional: base, ethereum, polygon, robinhood)

### `GET /api/tokens/:address`

Get a specific token by contract address.

**Query parameters:**

- `chain` (required)

### `GET /api/stats`

Platform statistics.

### `GET /api/chains`

Chain configuration and status.

## Project Structure

```
├── apps/
│   ├── api/          Express API server
│   ├── dashboard/    React/Vite frontend
│   └── indexer/      Multi-chain block indexer
├── packages/
│   ├── ai/           AI analysis utilities
│   ├── analytics/    Analytics primitives
│   ├── blockchain/   Chain abstraction layer
│   ├── config/       Shared environment configuration (Zod)
│   ├── database/     Prisma ORM + repository layer
│   ├── shared/       Shared utilities and logging
│   └── ui/           Reusable UI components
├── Dockerfile        Multi-stage Docker build
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Observability

- **Health checks:** `/health` reports dependency status; `/ready` reports readiness for orchestration
- **Metrics:** `/metrics` exposes Prometheus metrics for monitoring and alerting
- **Logging:** Structured JSON in production, human-readable in development; supports log levels and request IDs
- **Request IDs:** Every request gets a unique ID (X-Request-Id), propagated through logs and error responses

## Security

- Helmet security headers
- CORS configurable via `CORS_ORIGIN`
- Rate limiting configurable via `RATE_LIMIT_*` env vars
- `X-Powered-By` header disabled
- Trusted proxy support (behind nginx/reverse proxy)

## Development

```bash
# Lint
pnpm lint

# TypeScript type-check
pnpm typecheck

# Build all packages
pnpm build

# Run tests (when available)
pnpm test
```
