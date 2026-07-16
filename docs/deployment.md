# Deployment Guide

## Local Docker Deployment

### Prerequisites

- Docker & Docker Compose
- Git

### Steps

```bash
# Clone the repository
git clone https://github.com/maic93/token-intelligence-ai.git
cd token-intelligence-ai

# Configure environment
cp .env.example .env
# Edit .env with your RPC URLs and database credentials

# Build and start all services
docker compose up --build

# Or start in detached mode
docker compose up --build -d

# View logs
docker compose logs -f api
docker compose logs -f indexer
```

### Services

| Service    | Port | Description                 |
| ---------- | ---- | --------------------------- |
| API        | 4000 | REST API + dashboard        |
| Indexer    | —    | Multi-chain block indexer   |
| PostgreSQL | 5432 | Token database              |
| Redis      | 6379 | Cache and WebSocket pub/sub |

---

## Production VPS Deployment

### Requirements

- Linux server (Ubuntu 24.04 LTS recommended)
- Docker & Docker Compose
- Reverse proxy (Caddy, nginx, or Traefik)
- Domain name (optional)

### 1. Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt-get install docker-compose-plugin
```

### 2. Clone and Configure

```bash
git clone https://github.com/maic93/token-intelligence-ai.git
cd token-intelligence-ai

# Create production environment file
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:changeme@postgres:5432/token_intelligence
REDIS_URL=redis://redis:6379
BASE_RPC_URL=https://mainnet.base.org
ETHEREUM_RPC_URL=https://eth.merkle.io
POLYGON_RPC_URL=https://polygon-rpc.com
START_BLOCK=0
BACKFILL_BLOCKS=0
POLL_INTERVAL_MS=12000
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX=100
LOG_LEVEL=info
POSTGRES_PASSWORD=changeme
EOF
```

### 3. Deploy

```bash
# Start all services
docker compose -f docker-compose.prod.yml up --build -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 4. Reverse Proxy (Caddy)

```caddy
your-domain.com {
    reverse_proxy localhost:4000
}
```

```bash
# Create Caddyfile and start Caddy
sudo docker run -d \
  --name caddy \
  --restart unless-stopped \
  -p 80:80 -p 443:443 \
  -v $PWD/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  caddy:2
```

---

## Vercel Deployment (Dashboard Only)

### Steps

1. Push the repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Configure the project:

| Setting          | Value                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Framework        | Vite                                                                                     |
| Root Directory   | `apps/dashboard`                                                                         |
| Build Command    | `pnpm install --frozen-lockfile && pnpm --filter @token-intelligence-ai/dashboard build` |
| Output Directory | `dist`                                                                                   |
| Install Command  | (leave empty)                                                                            |

4. Add environment variable:
   - `VITE_API_URL`: URL of your deployed API (e.g., `https://api.your-domain.com`)

5. Deploy

The dashboard uses SPA routing (`vercel.json` rewrites all routes to `index.html`).

---

## Environment Variables

See [.env.example](../.env.example) for a complete reference with documentation.

### Required for Production

| Variable       | Description                        |
| -------------- | ---------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string       |
| `BASE_RPC_URL` | RPC endpoint for Base chain        |
| `REDIS_URL`    | Redis connection string (API only) |

### Production Best Practices

- Use strong passwords for `POSTGRES_PASSWORD`
- Set `CORS_ORIGIN` to your domain (not `*`)
- Set `NODE_ENV=production`
- Set `LOG_LEVEL=info` (or `warn` for quieter logs)
- Use a reverse proxy (Caddy, nginx) for TLS termination

---

## Database Migrations

Migrations run automatically on container startup via the entrypoint scripts.

### Manual Migration

```bash
# Run inside the api or indexer container
docker compose exec api sh -c "cd /app/packages/database && npx prisma migrate deploy"
```

### Rollback

```bash
# To reset the database (destroys all data):
docker compose down -v
docker compose up -d postgres
# Then restart api/indexer to re-run migrations
```

---

## Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up --build -d

# Or for production stack
docker compose -f docker-compose.prod.yml up --build -d
```

---

## Rollback Procedure

```bash
# Check deployed images
docker compose images

# Revert to a previous commit
git log --oneline
git checkout <previous-commit-hash>

# Rebuild and restart
docker compose up --build -d
```

---

## Troubleshooting

### Database connection refused

```
Error: connect ECONNREFUSED postgres:5432
```

Ensure PostgreSQL is healthy:

```bash
docker compose ps
docker compose logs postgres
```

### Indexer reports "No enabled chains found"

Set at least one RPC URL:

```bash
export BASE_RPC_URL=https://mainnet.base.org
```

### API health check failing

```bash
# Check if the API process is running
docker compose logs api

# Check database connectivity
docker compose exec api node -e "fetch('http://localhost:4000/health').then(r=>r.json()).then(console.log)"
```

### Out of disk space

```bash
# Prune unused Docker data
docker system prune -af

# Check volume usage
docker system df
```

### Permission denied in container

The application runs as the `node` user (non-root). If you encounter permission issues:

```bash
# Check volume ownership
docker compose exec api ls -la /app

# If needed, run a one-off command as root
docker compose exec --user root api chown -R node:node /app
```
