# Token Intelligence AI

Token Intelligence AI is an AI-powered blockchain intelligence platform for discovering, tracking, and analyzing newly deployed tokens across EVM networks. The platform focuses on identifying creator wallets, tracing funding sources, analyzing liquidity, and generating AI-driven risk reports.

## Vision

Build a production-grade foundation for open-source blockchain intelligence that helps researchers, analysts, and communities understand emerging token ecosystems with speed and clarity.

## Features

- Detect newly deployed tokens across supported chains
- Identify creator wallets and deployment metadata
- Trace funding and liquidity characteristics
- Generate AI-assisted risk and anomaly reports
- Expose a scalable API and analytics dashboard

## Supported Chains

Priority networks:

- Base (B20)
- Robinhood Chain

Planned expansion:

- Ethereum
- Polygon
- Arbitrum
- Optimism

## Tech Stack

- TypeScript across the monorepo
- pnpm workspaces
- Docker and Docker Compose
- Node.js services for API, indexer, and dashboard
- PostgreSQL and Redis
- AI and analytics packages for future model integration

## Roadmap

### Phase 1

- Detect newly deployed tokens
- Detect creator wallet
- Detect liquidity
- Funding analysis
- Dashboard

### Phase 2

- AI risk scoring
- Creator reputation
- Wallet graph
- Exchange attribution
- Alerts

### Phase 3

- Historical analytics
- Public API
- Telegram bot
- Discord bot
- Multi-chain expansion

## Development Setup

1. Install pnpm
2. Copy .env.example to .env and update values
3. Start infrastructure services
   - docker compose up -d
4. Install dependencies
   - pnpm install
5. Start development workflows
   - pnpm dev

## Project Structure

- apps/api: backend API service
- apps/dashboard: web dashboard
- apps/indexer: ingestion and indexing service
- packages/ai: AI analysis utilities
- packages/analytics: analytics primitives
- packages/blockchain: chain abstraction layer
- packages/database: persistence layer
- packages/shared: shared utilities and contracts
- packages/ui: reusable UI components
