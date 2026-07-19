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
- **Premium Dashboard** — React 19 + Vite 6 dark-theme UI with glassmorphism, framer-motion animations, Lucide icons, collapsible sidebar, hero metrics, and responsive design
- **Token Risk Analysis** — Deterministic scoring engine for every discovered token (0–100 score, 5 risk levels, explainable factors)
- **Docker Deployment** — Multi-stage builds, healthchecks, Compose orchestration
- **Structured JSON Logging** — Pretty-print in dev, JSON in production, log levels
- **Health & Readiness Endpoints** — Dependency probing for Kubernetes
- **Prometheus Metrics** — HTTP request count/duration, indexed tokens, WS clients
- **Security Hardening** — Helmet, rate limiting, CORS, trusted proxy, request IDs
- **TypeScript Strict Mode** — Full-stack type safety across monorepo
- **Advanced Search** — Partial text search across name/symbol/address/deployer with chain, risk, score, date filters, cursor-based pagination, 6 sort modes
- **Platform Analytics** — Aggregated stats, per-chain breakdown, risk distribution, top deployers, auto-refreshing dashboard cards and charts
- **Watchlists & Alerts** — Anonymous browser-based watchlists via localStorage, real-time WebSocket alerts for watched tokens, floating notifications with auto-dismiss queue, bell icon with unread counter and dropdown
- **Metadata Validation Pipeline** — Strict ERC-20 metadata validation with rejection logging, confidence scoring (0–100), and sanitization of names/symbols

---

## Dashboard

### Screenshots

|                                                                |                                                    |
| :------------------------------------------------------------: | :------------------------------------------------: |
| ![Dashboard Overview](docs/screenshots/dashboard-overview.png) |   ![Token Grid](docs/screenshots/token-grid.png)   |
|          ![Analytics](docs/screenshots/analytics.png)          | ![Risk Details](docs/screenshots/risk-details.png) |

_Screenshots will be added to `docs/screenshots/` in a future update._

### UI Features

- **Premium Dark Theme** — Deep navy/slate palette with subtle gradients, glassmorphism nav bar, and soft shadows
- **Responsive Layout** — Collapsible sidebar, sticky top nav, mobile-friendly with hamburger menu
- **Hero Section** — Animated counter metrics with gradient background and staggered entrance animations
- **Stat Cards** — Icon + value + trend indicator with hover elevation and loading skeletons
- **Charts** — Lazy-loaded Recharts (BarChart per chain, DonutChart risk distribution) with custom legends and dark tooltips
- **Token Grid** — Animated card grid with token logo placeholder, color-coded risk score, pill filters, and copy/explorer/analytics/risk buttons
- **Risk Badges** — Pill-shaped badges for SAFE (green), LOW (lime), MEDIUM (yellow), HIGH (orange), CRITICAL (red)
- **Search** — Rounded search bar with animated clear button
- **Sidebar** — Animated collapsible sidebar with icons, active indicators, and section labels
- **Watchlists** — Star toggle on cards, panel with live score updates, WebSocket alerts with auto-dismiss toast queue
- **Risk Details Modal** — Animated modal with color-coded score, security check pass/fail list, and detailed metrics
- **Empty/Error States** — Professional empty state illustrations and retry-enabled error cards
- **Animations** — Framer Motion for card entrance, page transitions, hover effects, button taps, and modal appearances
- **Loading** — Shimmer skeletons matching card/stat layouts
- **Responsive** — Fully responsive from mobile (320px) to ultrawide, tablet-friendly sidebar

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

## Metadata Validation Pipeline

```
  ┌──────────────┐
  │  Contract    │
  │  Deployment  │
  └──────┬───────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  4/4 ABI Calls (RPC)            │
  │  symbol, decimals, name,        │
  │  totalSupply                    │
  │  ▼ reject if any call fails     │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  ABI Decoding                   │
  │  bytes32 / dynamic string       │
  │  ▼ reject on malformed ABI      │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  String Sanitization            │
  │  trim, NFKC, strip control/     │
  │  zero-width / NULL bytes        │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  Metadata Validation            │
  │  name, symbol, decimals,        │
  │  totalSupply rules              │
  │  ▼ reject on invalid metadata   │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  Confidence Score (0–100)       │
  │  data quality deductions        │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  PostgreSQL (Prisma)            │
  │  stores metadataConfidence      │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  REST API                       │
  │  exposes metadataConfidence     │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  Dashboard                      │
  │  ★★★★★ star rating + tooltip   │
  └──────────────────────────────────┘
```

Every discovered ERC-20 candidate passes through a strict validation pipeline before being persisted:

1. **ERC-20 Detection** (`detectErc20`) — All 4 ABI calls (symbol, decimals, name, totalSupply) are required. If any call fails at the RPC level, the candidate is rejected with a logged reason.
2. **ABI Decoding** — String fields are decoded from both `bytes32` and dynamic ABI encoding. Impossible offsets, impossible lengths, null bytes, and invalid UTF-8 return `null` instead of throwing.
3. **String Sanitization** (`sanitizeString`) — NULL bytes, control characters (U+0000–U+001F), zero-width characters (U+200B–U+200D, U+FEFF), and DEL (U+007F) are stripped, whitespace is trimmed, and text is NFKC-normalized.
4. **Metadata Validation** (`validateTokenMetadata`) — Validates name (max 128 chars, no NULL bytes, no replacement characters, <25% control chars), symbol (max 32 chars, not mostly binary), decimals (0–36 integer), and totalSupply (non-negative BigInt, ≤ 10^78). Helper contracts (tiny name, tiny symbol, 0 decimals) are rejected.
5. **Confidence Scoring** (`metadataConfidence`, 0–100) — Deductions based on data quality: missing name (-30), zero totalSupply (-10), bytes32 symbol (-5), empty name response (-10).
6. **Rejection Logging** — All rejected candidates are logged with `"Rejected candidate"` including the contract address and human-readable reason.

The validated metadata and confidence score are stored alongside the token in PostgreSQL and exposed via the API as `metadataConfidence`.

---

## B20 Detection Engine

### Overview

The B20 Detection Engine is a **heuristic classifier** that identifies probable B20-related tokens from indexed Base deployments. It does **not** use an official B20 API or registry — all classifications are based on weighted signals from on-chain metadata.

### Classification Pipeline

```
  ┌──────────────┐
  │  Token Created│
  └──────┬───────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  Name Keyword Scan               │
  │  B20 (+30), Base20 (+25),        │
  │  BTC (+20), SATS (+20),          │
  │  Ordinal (+15), Rune (+15),      │
  │  Inscribe (+10), Block (+5)      │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  Symbol Keyword Scan             │
  │  B20 (+35), SATS (+25),          │
  │  BTC (+25), RUNE (+20)           │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  Metadata Confidence Boost       │
  │  >=90 (+10), >=70 (+5)           │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  Recent Deployment Boost         │
  │  <24h old (+10)                  │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  Threshold Check                 │
  │  >=30 → isB20 = true             │
  │  <30  → isB20 = false            │
  └──────────────────────────────────┘
```

### Confidence Score

| Range  | Badge | Interpretation                                                          |
| ------ | ----- | ----------------------------------------------------------------------- |
| 90–100 | 🟢    | Strong B20 signals — multiple keyword matches, high metadata confidence |
| 70–89  | 🟡    | Moderate B20 signals — some keywords present                            |
| <70    | ⚪    | Weak B20 signals — minimal keyword overlap                              |

### Known Limitations

- **Heuristic only** — This is not an official B20 registry. Tokens may be false positives (matched by keyword coincidence) or false negatives (genuine B20 tokens without matching keywords).
- **No on-chain B20 verification** — The engine does not verify B20 protocol compatibility. It only analyzes metadata strings.
- **Keyword bias** — Tokens with names like "Bitcoin Block" will score higher regardless of actual B20 relevance.
- **Single chain** — Currently only indexes Base chain tokens.
- **Confidence ≠ quality** — A high B20 confidence score does not imply the token is safe or legitimate. Always verify independently.

### API Endpoint

`GET /api/b20` — Returns paginated B20 token list with analytics summary.

| Param           | Type | Default           | Description                                                   |
| --------------- | ---- | ----------------- | ------------------------------------------------------------- |
| `page`          | int  | `1`               | Page number                                                   |
| `limit`         | int  | `20`              | Items per page (max 100)                                      |
| `minConfidence` | int  | —                 | Minimum B20 confidence filter (0–100)                         |
| `sort`          | enum | `confidence_desc` | Sort: `confidence_desc`, `confidence_asc`, `newest`, `oldest` |

---

## Tech Stack

| Component     | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| Runtime       | Node.js 22                                                  |
| Language      | TypeScript 5.7 (strict mode)                                |
| Package Mgr   | pnpm 9.15 (workspace monorepo)                              |
| ORM           | Prisma 6                                                    |
| Database      | PostgreSQL 16                                               |
| Cache         | Redis 7                                                     |
| API Framework | Express 4                                                   |
| Frontend      | React 19 + Vite 6 + Framer Motion + Lucide React + Recharts |
| Container     | Docker + Compose (multi-stage, Alpine)                      |
| Linting       | ESLint 8 + Prettier 3                                       |
| Git Hooks     | Husky + lint-staged                                         |

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

### `GET /api/watch/events`

Returns recent watch events (token discovery, risk changes, high-risk alerts) with cursor pagination.

| Param    | Type   | Default | Description              |
| -------- | ------ | ------- | ------------------------ |
| `limit`  | int    | `50`    | Items per page (max 100) |
| `cursor` | string | —       | Cursor for pagination    |

```json
{
  "data": [
    {
      "id": "uuid",
      "eventType": "NEW_TOKEN",
      "message": "New token MyToken (MTK) discovered on Base",
      "metadata": { "chain": "base", "contractAddress": "0x..." },
      "createdAt": "2026-07-16T12:00:00.000Z",
      "token": { "chain": "base", "contractAddress": "0x...", "name": "MyToken", "symbol": "MTK" }
    }
  ],
  "nextCursor": "uuid...",
  "total": 42
}
```

### `GET /api/watch/:address`

Returns watch events for a specific token contract address. Supports same `limit` and `cursor` params as `/api/watch/events`.

### WebSocket — `/ws`

Connect to `/ws` for real-time events. Two message formats:

**Token discovery (backwards compatible):**

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

**Watch events (new):**

```json
{
  "type": "WATCH_EVENT",
  "event": {
    "id": "uuid",
    "tokenId": "uuid",
    "eventType": "HIGH_RISK",
    "message": "MyToken (MTK) flagged as high risk (score: 75/100)",
    "metadata": {
      "chain": "base",
      "contractAddress": "0x...",
      "riskScore": 75,
      "riskLevel": "high"
    },
    "createdAt": "2026-07-16T12:00:00.000Z"
  }
}
```

Event types: `NEW_TOKEN`, `RISK_CHANGED`, `HIGH_RISK`, `TOKEN_UPDATED`, `SYSTEM`.

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
- [x] Real-time alerts and notifications (watchlists, WebSocket alerts, floating notifications, bell icon)
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
