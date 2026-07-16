import { Router, type Router as RouterType } from 'express';
import client from 'prom-client';
import { prisma } from '@token-intelligence-ai/database';

const router: RouterType = Router();

client.collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

let indexedTokensGauge: client.Gauge | null = null;
let wsClientsGauge: client.Gauge | null = null;
let redisCacheHits: client.Counter | null = null;
let redisCacheMisses: client.Counter | null = null;

export function initMetrics() {
  indexedTokensGauge = new client.Gauge({
    name: 'indexed_tokens_total',
    help: 'Total number of indexed tokens across all chains',
  });

  wsClientsGauge = new client.Gauge({
    name: 'websocket_clients',
    help: 'Number of connected WebSocket clients',
  });

  redisCacheHits = new client.Counter({
    name: 'redis_cache_hits_total',
    help: 'Total number of Redis cache hits',
  });

  redisCacheMisses = new client.Counter({
    name: 'redis_cache_misses_total',
    help: 'Total number of Redis cache misses',
  });
}

export function trackRequest(
  method: string,
  route: string,
  statusCode: number,
  durationMs: number,
): void {
  httpRequestsTotal.inc({ method, route, status_code: statusCode });
  httpRequestDuration.observe({ method, route, status_code: statusCode }, durationMs);
}

export async function updateTokenCount(): Promise<void> {
  if (!indexedTokensGauge) return;
  try {
    const count = await prisma.token.count();
    indexedTokensGauge.set(count);
  } catch {
    /* ignore */
  }
}

export function setWsClients(count: number): void {
  wsClientsGauge?.set(count);
}

export function incrementCacheHit(): void {
  redisCacheHits?.inc();
}

export function incrementCacheMiss(): void {
  redisCacheMisses?.inc();
}

router.get('/', async (_req, res) => {
  await updateTokenCount();
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

export { router as metricsRouter, client as promClient };
