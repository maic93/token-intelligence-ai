# Contributing to Token Intelligence AI

Thank you for your interest in contributing. This guide explains how to set up the project for development and submit changes.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `pnpm install`
4. Set up infrastructure: `docker compose up -d postgres redis`
5. Build all packages: `pnpm build`
6. Run linting: `pnpm lint --max-warnings 0`
7. Run type-checking: `pnpm typecheck`

## Development Workflow

### Branch Naming

Use descriptive branch names with a prefix:

- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation changes
- `refactor/` — code restructuring
- `chore/` — tooling or CI changes

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add multi-chain indexing
fix: handle BigInt serialization in API response
docs: update API endpoint documentation
refactor: extract TokenRepository interface
```

### Before Submitting

Ensure your changes pass all checks:

```bash
pnpm install --frozen-lockfile
pnpm lint --max-warnings 0
pnpm typecheck
pnpm build
docker compose build api
docker compose build indexer
```

## Pull Request Process

1. Create a pull request from your branch to `main`
2. Describe what your changes do and why
3. Link any related issues
4. Ensure CI passes
5. Request a review from a maintainer

## Code Style

- TypeScript strict mode is enforced
- Use `pnpm lint` and `pnpm format` (via Prettier) before committing
- No `console.log` in source code — use the structured logger from `@token-intelligence-ai/shared`
- Workspace packages must use project references in `tsconfig.json`

## Project Structure

```
apps/
  api/          Express API server
  dashboard/    React / Vite frontend
  indexer/      Multi-chain block indexer
packages/
  ai/           AI analysis (future)
  analytics/    Analytics pipeline
  blockchain/   Chain abstraction layer
  config/       Shared env validation (Zod)
  database/     Prisma ORM + repositories
  shared/       Logger and common types
  ui/           Shared UI components (future)
```

## Questions

Open a [GitHub Discussion](https://github.com/maic93/token-intelligence-ai/discussions) for questions or feature proposals.
