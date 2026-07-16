# Token Intelligence AI

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green?logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-9.15-F69220?logo=pnpm)](https://pnpm.io/)
[![CI](https://github.com/maic93/token-intelligence-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/maic93/token-intelligence-ai/actions)

**Multi-chain ERC-20 discovery platform with real-time monitoring and production API.**

</div>

Token Intelligence AI is an open-source platform that continuously indexes supported EVM blockchains for newly deployed ERC-20 tokens, stores enriched token metadata in PostgreSQL, exposes a production-grade REST API with WebSocket streaming, and provides a real-time React dashboard for monitoring.

---

## Features

- **Multi-chain Indexing** — Base, Ethereum, Polygon, Robinhood chain
- **Automatic ERC-20 Detection** — Symbol, decimals, total supply, deployer extraction
- **PostgreSQL + Prisma** — Type-safe ORM with automatic migrations
- **Redis Caching** — Token lists cached 15s, individual tokens 5min, stats 30s
- **REST API** — Paginated token lists, per-token lookup, platform stats, chain status
- **WebSocket Updates** — Live token discovery pushed to connected clients
- **Real-time Dashboard** — React 19 + Vite 6 dark-theme UI
- **Token Risk Analysis** — Deterministic scoring engine for every discovered token (0–100 score, 5 risk levels, explainable factors)
- **Docker Deployment** — Multi-stage builds, healthchecks, Compose orchestration
- **Structured JSON Logging** — Pretty-print in dev, JSON in production, log levels
- **Health & Readiness Endpoints** — Dependency probing for Kubernetes
- **Prometheus Metrics** — HTTP request count/duration, indexed tokens, WS clients
- **Security Hardening** — Helmet, rate limiting, CORS, trusted proxy, request IDs
- **TypeScript Strict Mode** — Full-stack type safety across monorepo
- **Advanced Search** — Partial text search across name/symbol/address/deployer with chain, risk, score, date filters, cursor-based pagination, 6 sort modes
- **Platform Analytics** — Aggregated stats, per-chain breakdown, risk distribution, top deployers, auto-refreshing dashboard cards and charts

---

## Architecture

```
                    ┌───────────────────────────┐
                    │     RPC Nodes             │
                    │  Base  ETH  Polygon  RH   │
                    └───────────┬───────────────┘
                                │
                    ┌───────────▼───────────────┐
                    │   Multi-chain Indexer     │
                    │   (one worker per chain)  │
                    │   ERC-20 Detection Engine │
                    │   Risk Analysis Engine     │
                    └───────────┬───────────────┘
                                │
                    ┌───────────▼───────────────┐
                    │       PostgreSQL          │
                    │   (Prisma ORM, Migrations)│
                    └───────┬───────────┬───────┘
                            │           │
              ┌─────────────▼──┐  ┌─────▼──────────┐
              │   REST API     │  │  Redis Pub/Sub │
              │  (Express)     │  │  (Cache + WS)  │
              └───────┬───────┘  └─────┬──────────┘
                      │                 │
              ┌───────┴─────────────────┴───────┐
              │        React Dashboard          │
              │   (Vite, WebSocket, Analytics)  │
              └─────────────────────────────────┘
```

---

## Tech Stack

| Component     | Technology                             |
| ------------- | -------------------------------------- |
| Runtime       | Node.js 22                             |
| Language      | TypeScript 5.7 (strict mode)           |
| Package Mgr   | pnpm 9.15 (workspace monorepo)         |
| ORM           | Prisma 6                               |
| Database      | PostgreSQL 16                          |
| Cache         | Redis 7                                |
| API Framework | Express 4                              |
| Frontend      | React 19 + Vite 6                      |
| Container     | Docker + Compose (multi-stage, Alpine) |
| Linting       | ESLint 8 + Prettier 3                  |
| Git Hooks     | Husky + lint-staged                    |

---

## Repository Structure

```
token-intelligence-ai/
├── apps/
│   ├── api/           Express API server (port 4000)
│   ├── dashboard/     React 19 + Vite 6 dashboard
│   └── indexer/       Multi-chain block indexer
├── packages/
│   ├── ai/            AI analysis utilities (future)
│   ├── analysis/      Token risk analysis engine (deterministic scoring)
│   ├── analytics/     Analytics pipeline (token, holder, liquidity, etc.)
│   ├── blockchain/    Chain abstraction + config
│   ├── config/        Shared env validation via Zod
│   ├── database/      Prisma schema + repositories
│   ├── shared/        Logger, types, common utilities
│   └── ui/            Shared UI components (future)
├── docs/
│   └── images/        Screenshots
├── .github/           Issue/PR templates
├── Dockerfile         Multi-stage Docker build
├── docker-compose.yml Service orchestration
└── pnpm-workspace.yaml
```

---

## Quick Start

### Requirements

- Node.js >= 22
- pnpm >= 9.15
- Docker & Docker Compose

### Clone and Run

```bash
# Clone the repository
git clone https://github.com/maic93/token-intelligence-ai.git
cd token-intelligence-ai

# Copy environment file and edit as needed
cp .env.example .env

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d postgres redis

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start API (terminal 1)
pnpm --filter @token-intelligence-ai/api dev

# Start Indexer (terminal 2)
pnpm --filter @token-intelligence-ai/indexer dev

# Start Dashboard (terminal 3)
pnpm --filter @token-intelligence-ai/dashboard dev
```

The dashboard is available at `http://localhost:5173`.

### Docker Production

```bash
# Build and start all services
docker compose up --build

# Or start individual services
docker compose up -d postgres redis
docker compose up --build api
docker compose up --build indexer
```

API is available at `http://localhost:4000`.

---

## Environment Variables

### General

| Variable    | Default       | Description                                      |
| ----------- | ------------- | ------------------------------------------------ |
| `NODE_ENV`  | `development` | Runtime environment                              |
| `LOG_LEVEL` | `info`        | Logging level (`debug`, `info`, `warn`, `error`) |

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

Set the RPC URL for each chain to enable it. Chains without a URL are automatically disabled.

| Variable            | Chain            |
| ------------------- | ---------------- |
| `BASE_RPC_URL`      | Base             |
| `ETHEREUM_RPC_URL`  | Ethereum Mainnet |
| `POLYGON_RPC_URL`   | Polygon          |
| `ROBINHOOD_RPC_URL` | Robinhood Chain  |

### Analytics

Analytics uses the same `REDIS_URL` as the API for caching. Falls back to in-memory cache if Redis is unavailable.

---

## API Documentation

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
  "database": "error",
  "redis": "disconnected"
}
```

### `GET /ready`

Kubernetes readiness probe. Returns 200 when database and at least one chain are available.

```json
{
  "ready": true,
  "database": true,
  "redis": "connected",
  "chainsConfigured": 3,
  "timestamp": "2026-07-16T12:00:00.000Z"
}
```

### `GET /metrics`

Prometheus metrics endpoint. Exposes HTTP request count/duration, indexed tokens, WebSocket clients, Redis cache hit/miss, and default Node.js metrics.

### `GET /api/tokens`

List discovered tokens with pagination and optional chain filter.

| Param   | Type | Default | Description                                                 |
| ------- | ---- | ------- | ----------------------------------------------------------- |
| `page`  | int  | `1`     | Page number (1-indexed)                                     |
| `limit` | int  | `20`    | Items per page (max 100)                                    |
| `chain` | enum | —       | Filter by chain: `base`, `ethereum`, `polygon`, `robinhood` |

```json
{
  "data": [
    {
      "contractAddress": "0x1234...abcd",
      "chain": "base",
      "chainId": 8453,
      "tokenName": "MyToken",
      "tokenSymbol": "MTK",
      "decimals": 18,
      "totalSupply": "1000000000000000000000000",
      "deployer": "0xabcd...5678",
      "blockNumber": "12345678",
      "blockTimestamp": "2026-07-16T12:00:00.000Z",
      "transactionHash": "0xabcd...ef01"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

### `GET /api/tokens/:address`

Look up a specific token by contract address. Requires `?chain=` query parameter.

```json
{
  "data": {
    "contractAddress": "0x1234...abcd",
    "chain": "base",
    "chainId": 8453,
    "tokenName": "MyToken",
    "tokenSymbol": "MTK",
    "decimals": 18,
    "totalSupply": "1000000000000000000000000",
    "deployer": "0xabcd...5678",
    "blockNumber": "12345678",
    "blockTimestamp": "2026-07-16T12:00:00.000Z",
    "transactionHash": "0xabcd...ef01"
  }
}
```

### `GET /api/stats`

Platform statistics.

```json
{
  "data": {
    "totalTokens": 1542,
    "recentTokens24h": 89,
    "uniqueDeployers": 423,
    "chains": [
      { "chain": "base", "count": 712 },
      { "chain": "ethereum", "count": 430 },
      { "chain": "polygon", "count": 400 }
    ],
    "cursors": [{ "chain": "base", "blockNumber": "12345678" }],
    "updatedAt": "2026-07-16T12:00:00.000Z"
  }
}
```

### `GET /api/chains`

Chain configuration and indexing status.

```json
{
  "data": {
    "chains": [
      {
        "name": "base",
        "chainId": 8453,
        "displayName": "Base",
        "explorerUrl": "https://basescan.org",
        "nativeCurrency": { "name": "Ether", "symbol": "ETH", "decimals": 18 },
        "enabled": true,
        "tokenCount": 712,
        "lastSyncedBlock": "12345678",
        "rpcAvailable": true
      }
    ],
    "updatedAt": "2026-07-16T12:00:00.000Z"
  }
}
```

### `GET /api/analysis/:address`

Returns the token risk analysis for a given contract address. Requires `?chain=` query parameter.

| Param     | Type   | Description                           |
| --------- | ------ | ------------------------------------- |
| `chain`   | string | Chain name (`base`, `ethereum`, etc.) |
| `address` | string | Token contract address (0x-prefixed)  |

```json
{
  "data": {
    "riskScore": 85,
    "riskLevel": "low",
    "explanation": "Token has no ERC20 symbol. Score: 80/100 — low risk.",
    "factors": [
      {
        "rule": "missing_symbol",
        "passed": false,
        "penalty": 20,
        "reason": "Token has no ERC20 symbol"
      }
    ],
    "analyzedAt": "2026-07-16T12:00:00.000Z"
  }
}
```

### `GET /api/tokens` (Extended)

All existing params plus the following search/filter/sort/cursor params:

| Param      | Type   | Default  | Description                                                                            |
| ---------- | ------ | -------- | -------------------------------------------------------------------------------------- |
| `q`        | string | —        | Search query (matches name, symbol, contract address, deployer)                        |
| `risk`     | enum   | —        | Filter by risk level: `very_safe`, `low`, `medium`, `high`, `critical`                 |
| `minScore` | number | —        | Minimum risk score (0–100)                                                             |
| `maxScore` | number | —        | Maximum risk score (0–100)                                                             |
| `deployer` | string | —        | Filter by deployer address (0x-prefixed)                                               |
| `sort`     | enum   | `newest` | Sort order: `newest`, `oldest`, `highest_risk`, `lowest_risk`, `name_asc`, `name_desc` |
| `cursor`   | string | —        | Cursor for pagination (from previous response)                                         |
| `from`     | string | —        | ISO 8601 date lower bound                                                              |
| `to`       | string | —        | ISO 8601 date upper bound                                                              |

**Response:**

```json
{
  "data": [
    {
      "contractAddress": "0x...",
      "chain": "base",
      "riskScore": 85,
      "riskLevel": "low",
      "...": "..."
    }
  ],
  "nextCursor": "abc123...",
  "total": 1542
}
```

### `GET /api/search`

General search endpoint — queries across name, symbol, contract address, and deployer with partial matching.

| Param    | Type   | Default | Description             |
| -------- | ------ | ------- | ----------------------- |
| `q`      | string | —       | Search query (required) |
| `chain`  | enum   | —       | Filter by chain         |
| `limit`  | int    | `20`    | Max results (max 100)   |
| `cursor` | string | —       | Cursor for pagination   |

### `GET /api/platform-analytics`

Aggregated platform statistics, automatically recalculated and cached.

| Field              | Type           | Description                          |
| ------------------ | -------------- | ------------------------------------ |
| `totalTokens`      | number         | Total discovered tokens              |
| `tokensToday`      | number         | Tokens discovered in last 24 hours   |
| `tokensThisWeek`   | number         | Tokens discovered in last 7 days     |
| `tokensThisMonth`  | number         | Tokens discovered in last 30 days    |
| `averageRiskScore` | number \| null | Average risk score across all tokens |
| `riskDistribution` | object         | Count per risk level                 |
| `tokensPerChain`   | array          | Token count per chain                |
| `topDeployers`     | array          | Deployers ranked by token count      |
| `latestTokens`     | array          | Most recently discovered tokens      |

### `GET /api/deployers/:address`

Returns deployer metadata and paginated token list.

| Param   | Type | Description     |
| ------- | ---- | --------------- |
| `chain` | enum | Filter by chain |

**Response:**

```json
{
  "data": {
    "deployer": "0x...",
    "totalContracts": 42,
    "chains": ["base", "ethereum"],
    "firstDeployment": "2026-01-01T00:00:00.000Z",
    "latestDeployment": "2026-07-16T12:00:00.000Z",
    "averageRiskScore": 45,
    "tokens": [
      {
        "contractAddress": "0x...",
        "chain": "base",
        "riskScore": 85,
        "riskLevel": "low",
        "...": "..."
      }
    ]
  }
}
```

### Token List & Detail

The `GET /api/tokens` and `GET /api/tokens/:address` endpoints include:

| Field       | Type             | Description                                                   |
| ----------- | ---------------- | ------------------------------------------------------------- |
| `riskScore` | `number \| null` | Risk score (0–100, null if unanalyzed)                        |
| `riskLevel` | `string \| null` | Risk level (`very_safe`, `low`, `medium`, `high`, `critical`) |

### `GET /api/analytics/:chain/:address`

Returns a complete analytics report for the specified token. Cached for 5 minutes.

| Param     | Type   | Description                           |
| --------- | ------ | ------------------------------------- |
| `chain`   | string | Chain name (`base`, `ethereum`, etc.) |
| `address` | string | Token contract address (0x-prefixed)  |

### WebSocket — `/ws`

Connect to `/ws` for real-time token discovery events.

```json
{
  "event": "token:discovery",
  "data": {
    "contractAddress": "0x...",
    "chain": "base",
    "chainId": 8453,
    "tokenName": "NewToken",
    "tokenSymbol": "NEW",
    "decimals": 18,
    "totalSupply": "1000000...",
    "deployer": "0x...",
    "blockNumber": "12345678",
    "blockTimestamp": "2026-07-16T12:00:00.000Z",
    "transactionHash": "0x..."
  }
}
```

---

## Screenshots

| Dashboard                               | Analytics                         |
| --------------------------------------- | --------------------------------- |
| ![Dashboard](docs/images/dashboard.png) | ![Analytics](docs/images/api.png) |

_Screenshots are placeholders. Real screenshots will be added after deployment._

---

## Development

```bash
# Install dependencies
pnpm install

# Lint all files
pnpm lint --max-warnings 0

# TypeScript type-check
pnpm typecheck

# Build all packages
pnpm build

# Start infrastructure
docker compose up -d postgres redis

# Run database migrations (first time only)
cd packages/database && npx prisma migrate deploy && cd ../..
```

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the pull request process.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## Roadmap

### Current

- [x] Multi-chain indexing (Base, Ethereum, Polygon, Robinhood)
- [x] Real-time dashboard with WebSocket updates
- [x] Production REST API with pagination, filtering, caching
- [x] Analytics engine (token, holder, liquidity, transaction, deployer, chain)
- [x] Docker multi-stage deployment with healthchecks
- [x] Prometheus metrics and structured logging

### Current

- [x] Token risk scoring engine (deterministic, 0–100, 7 rules, explainable)
- [x] Advanced search & filtering (query, chain, risk level, score range, deployer, date range, sort, cursor pagination)
- [x] Platform analytics dashboard (aggregated stats, per-chain breakdown, risk distribution, top deployers)
- [x] Deployer profile page (deployer metadata + token list with chain filter)
- [ ] AI-powered anomaly detection
- [ ] Real-time alerts and notifications
- [ ] Portfolio tracking
- [ ] Authentication and API keys
- [ ] Historical price and liquidity charts
- [ ] GraphQL API
- [ ] Kafka event streaming pipeline

### Future

- [ ] Solana support
- [ ] Arbitrum support
- [ ] Optimism support
- [ ] Avalanche support
- [ ] BNB Chain support

---

## License

[MIT](LICENSE) © 2026 Token Intelligence AI
