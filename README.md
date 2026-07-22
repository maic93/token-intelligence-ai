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
- **B20 Detection Engine** — Heuristic classifier with weighted keyword signals, metadata confidence boost, and recency boost
- **Deployer Intelligence Engine** — Wallet reputation scoring (0–100, 5 grades), deployer analytics, risk distribution, metadata quality, B20 history
- **Metadata Validation Pipeline** — Strict ERC-20 metadata validation with rejection logging, confidence scoring (0–100), and sanitization of names/symbols
- **AI Token Intelligence Engine** — Deterministic explainable-AI pipeline that classifies every token into 8 categories (MEME, AI, DEFI, GAMING, NFT, B20, UTILITY, UNKNOWN), generates human-readable summaries, assigns a confidence score, and produces a recommendation (SAFE, WATCH, CAUTION, AVOID) — all without external APIs
- **Multi-Chain Intelligence Engine** — Central Chain Registry with canonical chain definitions, generic EVM worker manager, automatic multi-chain discovery, per-chain health monitoring (Healthy/Slow/Behind/Offline), RPC latency tracking, explorer abstraction layer, chain analytics dashboard

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

## Historical Analytics & Trending Intelligence

The Historical Analytics Engine (TASK 4 of Prompt 023) tracks token indexing activity over time, supporting three temporal windows (hourly, daily, weekly). It generates trend snapshots, category growth rates, chain activity metrics, and deployer trends — all computed incrementally without full-DB recomputation.

### Architecture

- **`packages/analysis/src/trend-engine.ts`** — Pure functions for period timestamp calculation, trend update computation, overview aggregation, and category growth percentage.
- **`packages/database/src/trend-repository.ts`** — `TrendRepository` class interfacing with Prisma models for upsert/get operations on snapshots, category/chain/deployer trends, category summaries, and top-N queries.
- **Prisma models** — `AnalyticsSnapshot`, `CategoryTrend`, `ChainTrend`, `DeployerTrend` in `packages/database/prisma/schema.prisma`.
- **`apps/indexer/src/processor.ts`** — `BlockProcessor` calls `updateTrends()` after each token index to incrementally update all trend windows.
- **`apps/api/src/routes/trends.ts`** — REST endpoints: `GET /api/trends` (overview + all trends), `GET /api/trends/category/:category`, `GET /api/trends/chain/:chain`, `GET /api/trends/deployer/:wallet`.
- **`apps/dashboard/src/components/TrendsDashboard.tsx`** — React dashboard with SVG bar charts, pie charts, and tables showing trending tokens, deployers, chains, and category summaries.

### Key Design Decisions

- **UTC timestamps** — All aggregation windows use UTC methods (`setUTCMinutes`, `setUTCHours`, etc.) for consistent behavior across time zones.
- **Weekly boundary** — Weeks start on Monday at 00:00 UTC.
- **Incremental updates** — Each token index triggers a single `updateTrends()` call that upserts all three period snapshots, avoiding full recomputation.
- **Growth calculation** — Category growth = `((current - previous) / previous) * 100`, returns 0 for no data, 100 for new categories with no prior data.
- **Average aggregation** — Risk scores rounded to integer, metadata/AI confidence rounded to 1 decimal place; null values filtered out from averages.

### Test Coverage

- **`packages/analysis/src/__tests__/trend-engine.test.ts`** — 42 tests covering:
  - `getPeriodTimestamp`: hourly/daily/weekly boundaries, midnight edge cases, month/year transitions, time reset verification.
  - `computeTrendUpdate`: returns correct periods, chain, category, deployer; handles B20 tokens, null risk scores.
  - `computeOverview`: empty datasets, single/multiple entries, average calculations, null filtering, rounding precision.
  - `computeCategoryGrowth`: positive/negative/zero growth, fractional percentages, large numbers, edge cases with no prior data.

---

## Smart Money Intelligence Engine

Identifies wallets worth following using deterministic heuristics — no external APIs, no AI models.

### Scoring Pipeline

```
Token Index → Wallet Profile → Smart Money Score → Grade + Labels
```

The `calculateSmartMoneyScore()` function in `packages/analysis/src/smart-money.ts` computes a 0–100 score from:

- **Positive signals**: high reputation (+15), long activity history (+10), many successful launches (+15), low average risk (+10), high metadata confidence (+10), high AI confidence (+5), healthy deployment cadence (+8), multi-chain activity (+5), prolific creator (+5).
- **Negative signals**: many rugs (-20), high failure rate (-10), critically high average risk (-15), rapid spam deployments (-15), very new wallet (-10), mostly meme tokens (-10).

### Grades

| Score Range | Grade        |
| ----------- | ------------ |
| 90–100      | Elite        |
| 70–89       | Professional |
| 50–69       | Experienced  |
| 30–49       | Average      |
| 15–29       | Speculative  |
| 0–14        | Dangerous    |

### Labels

Automatically assigned: `Early Adopter`, `Meme Specialist`, `AI Specialist`, `DeFi Specialist`, `NFT Specialist`, `B20 Specialist`, `Multi-chain`, `Builder`, `Safe Creator`, `High Risk`, `Serial Launcher`.

### Architecture

- **`SmartMoneyProfile`** — Prisma model in `packages/database/prisma/schema.prisma` (table: `smart_money_profiles`).
- **`packages/database/src/smart-money-repository.ts`** — `SmartMoneyRepository` with upsert, list, overview, and filtering methods.
- **Automatic updates** — `recomputeSmartMoneyProfile()` called in `apps/indexer/src/processor.ts` after each token index + analysis.
- **API** — `GET /api/smart-money` (list with page/limit/grade/label/minScore/sort), `GET /api/smart-money/overview`, `GET /api/smart-money/top`, `GET /api/smart-money/newest`, `GET /api/smart-money/grade/:grade`, `GET /api/smart-money/:wallet` (profile + deployments + categories + risk distribution).
- **Signals** — `GET /api/signals/smart-money` returns deterministic signals: `NEW_ELITE_WALLET`, `SCORE_INCREASE`, `NEW_MULTI_CHAIN`, `SERIAL_SUCCESS`, `SERIAL_FAILURE`, `HIGH_WIN_RATE`.
- **Dashboard** — `SmartMoneyDashboard.tsx` with grade filters, stat widgets (elite/professional/dangerous count, avg score, avg win rate), and wallet cards.
- **Wallet Detail** — `SmartMoneyWallet.tsx` with timeline, charts, categories, risk distribution, and explorer links.

### Test Coverage

- **`packages/analysis/src/__tests__/smart-money.test.ts`** — 42 tests covering: grade boundaries (7), deterministic output, score bounds, empty wallet, elite wallet, spam wallet, multi-chain bonus, label assignment, penalty verification, signal reasons, summary generation, edge cases.

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
| `ROBINHOOD_WS_URL`  | Robinhood WS     |

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

### `GET /api/chains/:chain`

Single chain detail with health and metrics.

**Response:**

```json
{
  "data": {
    "name": "robinhood",
    "chainId": 4663,
    "displayName": "Robinhood Chain",
    "explorerUrl": "https://robinhoodchain.blockscout.com",
    "enabled": true,
    "tokenCount": 42,
    "lastSyncedBlock": "12345678",
    "nativeCurrency": { "name": "Ether", "symbol": "ETH", "decimals": 18 }
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

### `GET /api/chains/status`

Per-chain health monitoring.

**Response:**

```json
{
  "data": {
    "chains": [
      {
        "name": "base",
        "chainId": 8453,
        "displayName": "Base",
        "enabled": true,
        "connected": true,
        "logo": "🔷",
        "color": "#0052FF",
        "currentBlock": null,
        "lastIndexedBlock": "24567890",
        "blocksBehind": 0,
        "tokenCount": 712,
        "workerStatus": "running"
      }
    ]
  }
}
```

### `GET /api/leaderboards/:category`

Cross-chain leaderboards. Categories: `deployers`, `smart-money`, `opportunity`, `lowest-risk`, `funding`, `chains`.

**Response:**

```json
{
  "data": [
    {
      "rank": 1,
      "identifier": "0x...",
      "displayName": "0xabc...",
      "value": 50,
      "extra": { "reputationScore": 85 }
    }
  ]
}
```

### `GET /api/cross-chain-analytics`

Unified cross-chain analytics with per-chain breakdowns, averages, and daily trends.

**Response:** Summary with total tokens, tokens today/this week, most active chain, per-chain metrics, smart money overview, funding overview, and 14-day daily trend.

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

## Deployer Intelligence Engine

The Deployer Intelligence Engine builds a **reputation score** for every wallet that has deployed tokens on the platform. Instead of treating all deployers equally, the engine analyzes on-chain behavior to produce a deterministic reputation score (0–100) and grade.

### Reputation Pipeline

```
New Token Indexed
        │
        ▼
Compute Deployer Analytics
├── total tokens created
├── risk distribution (low / medium / high)
├── average risk score
├── average metadata confidence
├── average B20 confidence
├── unique names / symbols (variety)
├── duplicate names / symbols
└── deployment span (time between first and last)
        │
        ▼
Calculate Deployer Reputation
├── Start at neutral (50)
├── + for high metadata confidence
├── + for many successful low-risk tokens
├── + for low average risk scores
├── + for diverse naming / symbols
├── + for established history (≥10 tokens, >30 days span)
├── − for low metadata confidence
├── − for majority high-risk tokens
├── − for above-average risk scores
├── − for duplicate names / symbols
└── − for suspiciously rapid deployments
        │
        ▼
Grade Assignment
├──  0–19  → 🔴 Dangerous
├── 20–39  → 🟠 Poor
├── 40–59  → 🟡 Average
├── 60–79  → 🟢 Good
└── 80–100 → 🟢 Excellent
        │
        ▼
Store on Token + DeployerAnalytics table
```

### Scoring Weights

| Signal                          | Adjustment | Condition                    |
| ------------------------------- | ---------- | ---------------------------- |
| High metadata confidence        | +15        | avg ≥ 90                     |
| Good metadata confidence        | +8         | avg ≥ 70                     |
| Low metadata confidence         | −8         | avg < 50                     |
| Many successful low-risk tokens | +15        | successRate ≥ 80%, ≥5 tokens |
| Mostly successful tokens        | +8         | successRate ≥ 60%, ≥3 tokens |
| Majority high-risk              | −15        | rugRate > 50%, ≥3 tokens     |
| Many high-risk                  | −8         | rugRate > 30%, ≥3 tokens     |
| Consistently low risk scores    | +10        | avgRisk ≤ 20                 |
| Mostly low risk scores          | +5         | avgRisk ≤ 40                 |
| Consistently high risk scores   | −15        | avgRisk ≥ 80                 |
| Above average risk scores       | −8         | avgRisk ≥ 60                 |
| Diverse token names             | +5         | nameVariety ≥ 70%            |
| Duplicate names                 | −5         | nameVariety < 30%            |
| Diverse token symbols           | +5         | symbolVariety ≥ 80%          |
| Duplicate symbols               | −5         | symbolVariety < 30%          |
| Suspicious rapid deployments    | −15        | ≥5 tokens, span < 1 day      |
| Very rapid deployments          | −10        | ≥3 tokens, span < 0.5 days   |
| Established deployer            | +10        | ≥10 tokens, span > 30 days   |

### API Endpoints

**GET /api/deployers** — List top and worst deployers

```json
{
  "top": [{ "wallet": "0x...", "tokensCreated": 38, "reputationScore": 92, "reputationGrade": "Excellent", ... }],
  "worst": [{ "wallet": "0x...", "tokensCreated": 17, "reputationScore": 12, "reputationGrade": "Dangerous", ... }],
  "overview": { "averageCreatorReputation": 58, "bestCreator": {...}, "worstCreator": {...}, "repeatDeployers": 12, "totalDeployers": 45 }
}
```

**GET /api/deployers/:wallet** — Detailed deployer profile

```json
{
  "data": {
    "deployer": "0x...",
    "reputation": { "score": 85, "grade": "Excellent", "reasons": ["high metadata confidence", ...] },
    "totalContracts": 38,
    "chains": ["base", "ethereum"],
    "b20Tokens": 3,
    "analytics": { "highRisk": 2, "mediumRisk": 5, "lowRisk": 31, "avgRiskScore": 22, ... },
    "tokens": [...]
  }
}
```

### Dashboard Features

- **Deployers page**: Sidebar navigation → list of top/worst deployers with reputation scores, toggle view
- **Wallet Intelligence modal**: Click any deployer → reputation grade with icon, score, factors, risk distribution, metadata quality, B20 activity, timeline, explorer links, recent token list
- **Token cards**: Creator line shows star rating (★) and grade text with color coding
- **Analytics page widgets**: Average creator reputation, best/worst creator, repeat deployers count
- **Grade highlighting**: 🔴 Dangerous, 🟠 Poor, 🟡 Average, 🟢 Good, 🟢 Excellent (on token cards and deployer list)

### Known Limitations

- Reputation is **deterministic** — no ML or external signals
- Newly indexed tokens update reputation only on creation (not retroactively)
- Risk distribution is approximate until analysis runs on each token
- Cross-chain reputation is computed per-chain (not merged across all chains)
- The system does not detect wash trading, Sybil attacks, or off-chain behavior

---

## AI Token Intelligence Engine

The AI Token Intelligence Engine is a **deterministic explainable-AI pipeline** that produces human-readable assessments for every indexed token — without using any external AI API, LLM, or ML model. It classifies tokens into categories, assigns a confidence score, generates a plain-English summary, and emits a recommendation.

### Classification Pipeline

```
New Token Indexed
        │
        ▼
Collect Signals
├── token name + symbol
├── risk score + risk level (from Risk Analysis Engine)
├── metadata confidence (from Metadata Validation Pipeline)
├── B20 classification (from B20 Detection Engine)
└── deployer reputation (from Deployer Intelligence Engine)
        │
        ▼
Category Scoring
├── 20+ keyword regex patterns matched against name/symbol
├── each match contributes a weighted score (15–35) to a category
├── B20 classifier result adds +20 confirmation boost
├── deployer/risk/metadata signals added to reasoning
        │
        ▼
Category Selection
├── Highest-scoring category wins
├── Tie → B20 preferred, else first highest
├── No matches → UNKNOWN
        │
        ▼
Confidence Calculation
├── ≥50 total score → 50 + score (max 95)
├── ≥25 total score → 30 + score (max 75)
├── >0 total score  → 15 + score (max 50)
└── 0 total score   → 0
        │
        ▼
Recommendation Logic
├── B20 with ≥70 confidence          → WATCH
├── risk ≤ 20 + rep ≥ 60 + meta ≥ 80 → SAFE
├── risk ≥ 70 OR rep ≤ 20 OR meta < 40 → AVOID
├── risk ≥ 40 OR rep ≤ 40            → CAUTION
└── otherwise                         → SAFE
        │
        ▼
Summary Generation
├── Category description ("Meme-themed token")
├── Risk descriptor ("with high/low/moderate risk characteristics")
├── Deployer quality ("created by a reputable/decent/low-rep deployer")
├── Metadata quality ("with verified/unverified metadata")
├── Scenario notes ("likely a speculative meme launch")
└── Recommendation text ("Low risk profile")
        │
        ▼
Store on Token (aiCategory, aiRecommendation, aiConfidence, aiSummary)
```

### Categories

| Category    | Examples                                 | Detection Signals                                     |
| ----------- | ---------------------------------------- | ----------------------------------------------------- |
| **MEME**    | DOGE, PEPE, SHIB, FLOKI, BONK, WOOF      | Dog/meme names, viral slang, cultural references      |
| **AI**      | AI, GPT, AGENT, BRAIN, NEURAL, DEEP      | AI/ML terminology in name or symbol                   |
| **DEFI**    | SWAP, STAKE, FARM, YIELD, VAULT, DEX     | DeFi protocol keywords                                |
| **GAMING**  | GAME, PLAY, GUILD, RAID, HERO, GAMEFI    | Gaming/metaverse terminology                          |
| **NFT**     | NFT, COLLECTION, ART, PIXEL, APE, PUNK   | NFT/collectible keywords                              |
| **B20**     | BTC, SATS, ORDI, Rune, Base20            | Bitcoin-ecosystem names + B20 classifier confirmation |
| **UTILITY** | GOVERNANCE, VOTE, DAO, PROTOCOL, STAKING | Governance/infrastructure keywords                    |
| **UNKNOWN** | —                                        | No keyword matches                                    |

### Recommendations

| Recommendation | Meaning                 | Conditions                                  |
| -------------- | ----------------------- | ------------------------------------------- |
| **SAFE**       | Low risk profile        | risk ≤ 20, deployer rep ≥ 60, metadata ≥ 80 |
| **WATCH**      | Monitor for development | High-confidence B20 or interesting signals  |
| **CAUTION**    | Proceed with caution    | Moderate risk (≥40) or deployer issues      |
| **AVOID**      | High risk — avoid       | risk ≥ 70, poor deployer, or bad metadata   |

### API Endpoints

**GET /api/intelligence** — List all token intelligence assessments

```json
{
  "data": [
    {
      "id": 42,
      "contractAddress": "0x...",
      "chain": "base",
      "name": "Pepe Coin",
      "symbol": "PEPE",
      "aiCategory": "MEME",
      "aiRecommendation": "CAUTION",
      "aiConfidence": 75,
      "aiSummary": "Meme-themed token with moderate risk characteristics. Low risk profile.",
      "deployerReputation": 55,
      "deployerGrade": "Average",
      "discoveredAt": "2026-07-19T12:00:00.000Z"
    }
  ],
  "pagination": { "total": 42, "limit": 50, "offset": 0 },
  "aggregations": {
    "categories": { "MEME": 15, "AI": 8, "B20": 5, "UNKNOWN": 14 },
    "recommendations": { "SAFE": 12, "WATCH": 5, "CAUTION": 18, "AVOID": 7 }
  }
}
```

Query parameters: `category`, `recommendation`, `chain`, `limit`, `offset`

**GET /api/intelligence/:contract** — Single token intelligence assessment

```json
{
  "data": {
    "contractAddress": "0x...",
    "chain": "base",
    "name": "Pepe Coin",
    "symbol": "PEPE",
    "aiCategory": "MEME",
    "aiRecommendation": "CAUTION",
    "aiConfidence": 75,
    "aiSummary": "Meme-themed token with moderate risk characteristics. Low risk profile.",
    "deployerReputation": 55,
    "deployerGrade": "Average",
    "metadataConfidence": 85,
    "isB20": false,
    "b20Confidence": 0,
    "discoveredAt": "2026-07-19T12:00:00.000Z"
  }
}
```

### Dashboard Features

- **AI Intelligence page**: Sidebar navigation → filterable grid by category/recommendation with category count cards and recommendation distribution bar
- **Token cards**: Each card shows AI category badge (color-coded), recommendation badge, confidence %, and generated summary text
- **Category stat cards**: Quick overview of how many tokens fall into each category (MEME, AI, DEFI, etc.)

## Wallet Intelligence Engine

The Wallet Intelligence Engine automatically profiles every deployer wallet and enriches every token with creator intelligence. It is fully deterministic and computed entirely from indexed on-chain data — no external AI APIs are used.

### Architecture

```
Token Indexed
    │
    ▼
Recompute Wallet Profile (single wallet, never all)
    │
    ├── Compute Metrics ─── totalDeployments, highRiskTokens, b20Tokens,
    │                       avgRisk, avgMetadataConfidence, avgAiConfidence,
    │                       walletAgeDays, deploymentSpanDays
    │
    ├── Reputation Score ─── 0-100 weighted from metrics
    │
    ├── Grade ─── Excellent / Good / Average / Poor / Dangerous
    │
    ├── Labels ─── Deterministic labels based on thresholds
    │
    └── Summary ─── Template-generated human-readable summary
```

### Reputation Scoring (0–100)

| Signal                                        | Adjustment |
| --------------------------------------------- | ---------- |
| Baseline                                      | 50         |
| High metadata confidence (≥90)                | +15        |
| Good metadata confidence (≥70)                | +8         |
| Low metadata confidence (<50)                 | −8         |
| ≥80% successful tokens with ≥5 deployments    | +15        |
| ≥60% successful tokens with ≥3 deployments    | +8         |
| >50% high-risk with ≥3 deployments            | −15        |
| >30% high-risk with ≥3 deployments            | −8         |
| Average risk ≤20                              | +10        |
| Average risk ≤40                              | +5         |
| Average risk ≥80                              | −15        |
| Average risk ≥60                              | −8         |
| 10+ total deployments                         | +5         |
| B20 tokens exist                              | −5         |
| ≥5 deployments in <1 day                      | −15        |
| ≥3 deployments in <0.5 day                    | −10        |
| ≥10 deployments over >30 days                 | +10        |
| Average AI confidence ≥80                     | +5         |
| Average AI confidence <30 with ≥3 deployments | −5         |

### Labels

| Label               | Condition                                |
| ------------------- | ---------------------------------------- |
| `NEW_DEPLOYER`      | Exactly 1 deployment                     |
| `SERIAL_DEPLOYER`   | 10+ deployments                          |
| `B20_CREATOR`       | 3+ B20 tokens                            |
| `HIGH_RISK_CREATOR` | 3+ high-risk tokens                      |
| `SPAMMER`           | ≥5 deployments with Poor/Dangerous grade |
| `SUSPICIOUS`        | 5+ high-risk tokens                      |
| `TRUSTED_CREATOR`   | Excellent/Good grade with 3+ deployments |
| `UTILITY_BUILDER`   | 5+ deployments with 0 high-risk          |
| `MEME_FACTORY`      | 1+ B20 tokens                            |

### API

**GET /api/wallets** — Paginated wallet list with filtering

```
?page=1&limit=20&grade=Good&label=TRUSTED_CREATOR&sort=reputation_desc&search=0x
```

**GET /api/wallets/:address** — Full wallet profile with risk distribution, AI category distribution, B20 distribution, deployment timeline, and recent tokens

### Pipeline Integration

Whenever a token is indexed and its analysis completes, the wallet profile for its deployer is recomputed automatically — never scanning every wallet.

### Dashboard

- **Wallet Intelligence page**: Table with grade, reputation, deployments, average risk, labels, and last seen
- **Filtering**: By grade, label, sort (reputation, deployments, risk, last active)
- **Wallet detail modal**: Copy address, reputation grade/score, deployment counts, risk distribution pie chart, AI category pie chart, B20 distribution, metadata confidence, deployment timeline bar chart, recent deployments list, explorer link
- **Stat cards**: Total Wallets, Trusted Wallets, Suspicious Wallets, Average Reputation, Serial Deployers

### Known Limitations

- Classification is **keyword-based** — subtle or obfuscated names may be miscategorized
- No multi-language support — only English keywords are matched
- Summary is **template-based**, not generated by an LLM
- Recommendations use simple thresholds and may miss nuanced risk profiles
- No historical tracking — category/recommendation is static once assigned

## Multi-Chain Intelligence Engine

The Multi-Chain Intelligence Engine provides a universal chain abstraction layer that makes adding new EVM chains a zero-code-change operation.

### Architecture

```
Chain Registry (packages/shared/src/chains.ts)
        │
        ▼
ChainWorkerManager (apps/indexer/src/worker-manager.ts)
        │
        ├── for each enabled chain ───► EvmWorker (generic)
        │                                     │
        │                                     ▼
        │                              Token Discovery
        │                                     │
        │                                     ▼
        │                              AI Intelligence
        │
        └── ChainHealthMonitor ───► Per-chain status tracking
                                      Healthy / Slow / Behind / Offline
```

### Chain Registry

One source of truth: `packages/shared/src/chains.ts`

```typescript
interface ChainDefinition {
  name: ChainName;
  chainId: number;
  displayName: string;
  rpcUrl: string;
  explorerUrl: string;
  enabled: boolean;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  supportsContracts: boolean;
}
```

| Chain     | chainId | Explorer                              | Native Currency |
| --------- | ------- | ------------------------------------- | --------------- |
| Base      | 8453    | https://basescan.org                  | ETH             |
| Ethereum  | 1       | https://etherscan.io                  | ETH             |
| Polygon   | 137     | https://polygonscan.com               | POL             |
| Robinhood | 4663    | https://robinhoodchain.blockscout.com | ETH             |

### Worker Manager

The `ChainWorkerManager` (TASK 4) loops through every enabled chain from the registry and spawns a generic EVM worker for each. Adding a new chain requires:

1. Add entry to `CANONICAL_CHAINS` in `packages/shared/src/chains.ts`
2. Set `{NAME}_RPC_URL` and `ENABLE_{NAME}` in environment

Zero code changes to the indexer.

### Chain Health Monitor

The `ChainHealthMonitor` continuously evaluates:

| Status  | Condition                                            |
| ------- | ---------------------------------------------------- |
| Healthy | Latency ≤ 2s, few failures, not behind               |
| Slow    | Latency > 2s                                         |
| Behind  | More than 100 blocks behind the tip                  |
| Offline | RPC unreachable or failure rate exceeds success rate |

Health is exposed via `GET /api/chains/status` (detailed per-chain health with block lag, connection status, worker state) and `GET /api/chains/analytics`. Broadcast via WebSocket on status changes.

### Explorer Abstraction

Instead of hardcoded explorer URLs, use shared utilities:

```typescript
getExplorerAddress(chain, address); // → https://{explorer}/address/{address}
getExplorerTx(chain, txHash); // → https://{explorer}/tx/{txHash}
getExplorerContract(chain, address); // → https://{explorer}/address/{address}
getChainExplorer(chain); // → https://{explorer}
```

Works automatically for Base, Robinhood, Ethereum, and Polygon.

### Dashboard

- **Chains page**: Cards for each chain showing current block, RPC latency, status, token/deployer counts, last sync, explorer link, and health badge
- **Chain Health page**: Dedicated widget with real-time status per chain, block lag alerts, worker state, and live metrics (auto-refreshes every 60s)
- **Chain Selector**: Reusable dropdown component integrated into token lists, dashboards, and filters — filter any view to a single chain
- **Live updates**: Dashboard auto-refreshes every 30 seconds and receives WebSocket push on chain status changes
- **Health badges**: Color-coded (green=Healthy, yellow=Slow, orange=Behind, red=Offline)
- **Cross-Chain Analytics page**: Unified platform metrics across all chains with per-chain breakdowns, smart money/funding overview, 14-day trend
- **Leaderboards page**: Six-section grid showing Top Deployers, Smart Money, Highest Opportunity, Lowest Risk, Largest Funding, and Most Active Chains

### Adding a New Chain

1. Add chain to `CANONICAL_CHAINS` in `packages/shared/src/chains.ts`
2. Add to `CHAIN_NAMES` and set default in `ENABLE_MAP`
3. Set `{NAME}_RPC_URL` and optionally `ENABLE_{NAME}` in `.env`
4. The `ChainWorkerManager` will automatically discover and start indexing

No changes needed to the indexer, processor, or dashboard — the chain is automatically registered.

### Robinhood Configuration

| Property     | Value                                              |
| ------------ | -------------------------------------------------- |
| Chain ID     | 4663                                               |
| Display Name | Robinhood Chain                                    |
| Explorer     | https://robinhoodchain.blockscout.com              |
| RPC          | `ROBINHOOD_RPC_URL` environment variable           |
| Native       | ETH (Ether)                                        |
| Enable       | Enabled by default when RPC URL is set             |
| Blockscout   | Primary explorer (not hoodscan.ai or robinscan.io) |

### API

**GET /api/chains/analytics** — Per-chain analytics

```json
{
  "data": {
    "chains": [
      {
        "name": "base",
        "chainId": 8453,
        "displayName": "Base",
        "enabled": true,
        "tokenCount": 142,
        "deployerCount": 89,
        "lastBlock": "24567890",
        "blocksBehind": 0,
        "health": "Healthy",
        "status": "connected",
        "rpcLatency": 340,
        "contractsToday": 12,
        "contractsHour": 3
      }
    ]
  }
}
```

## Roadmap

### Current

- [x] Multi-chain indexing (Base, Ethereum, Polygon, Robinhood)
- [x] Real-time dashboard with WebSocket updates
- [x] Production REST API with pagination, filtering, caching
- [x] Analytics engine (token, holder, liquidity, transaction, deployer, chain)
- [x] Docker multi-stage deployment with healthchecks
- [x] Prometheus metrics and structured logging
- [x] Central Chain Registry (shared source of truth)
- [x] Generic EVM worker (ChainWorkerManager)
- [x] Chain health monitoring and RPC latency tracking
- [x] Explorer abstraction layer
- [x] Chain analytics endpoint and dashboard
- [x] Robinhood Chain (chainId 4663, Blockscout explorer)

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
