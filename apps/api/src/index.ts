import { createLogger } from '@token-intelligence-ai/shared';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { prisma } from '@token-intelligence-ai/database';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { readyRouter } from './routes/ready.js';
import { tokensRouter } from './routes/tokens.js';
import { statsRouter, invalidateStatsCache } from './routes/stats.js';
import { chainsRouter } from './routes/chains.js';
import { chainAnalyticsRouter } from './routes/chain-analytics.js';
import { metricsRouter, trackRequest, initMetrics } from './routes/metrics.js';
import { analysisRouter } from './routes/analysis.js';
import { analyticsRouter, initAnalytics } from './routes/analytics.js';
import { deployersRouter, invalidateDeployerCache } from './routes/deployers.js';
import { platformAnalyticsRouter } from './routes/platform-analytics.js';
import { searchRouter } from './routes/search.js';
import { watchRouter } from './routes/watch.js';
import { b20Router } from './routes/b20.js';
import { intelligenceRouter } from './routes/intelligence.js';
import { walletsRouter } from './routes/wallets.js';
import { trendsRouter } from './routes/trends.js';
import { smartMoneyRouter } from './routes/smart-money.js';
import { fundingRouter } from './routes/funding.js';
import { signalsRouter } from './routes/signals.js';
import { signalsV2Router } from './routes/signals-v2.js';
import { chainHealthRouter } from './routes/chain-health.js';
import { leaderboardsRouter } from './routes/leaderboards.js';
import { crossChainAnalyticsRouter } from './routes/cross-chain-analytics.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { requestIdMiddleware } from './middleware/request-id.js';

const log = createLogger('api');
const app: import('express').Application = express();

initMetrics();
initAnalytics(config.REDIS_URL);

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin: config.CORS_ORIGIN === '*' ? '*' : config.CORS_ORIGIN.split(','),
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(requestIdMiddleware);
app.use(requestLogger(log));

const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

app.use('/health', healthRouter);
app.use('/ready', readyRouter);
app.use('/metrics', metricsRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/stats', statsRouter);
app.use('/api/chains', chainsRouter);
app.use('/api/chains/analytics', chainAnalyticsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/search', searchRouter);
app.use('/api/platform-analytics', platformAnalyticsRouter);
app.use('/api/deployers', deployersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/watch', watchRouter);
app.use('/api/b20', b20Router);
app.use('/api/intelligence', intelligenceRouter);
app.use('/api/wallets', walletsRouter);
app.use('/api/trends', trendsRouter);
app.use('/api/smart-money', smartMoneyRouter);
app.use('/api/funding', fundingRouter);
app.use('/api/signals', signalsRouter);
app.use('/api/signals-v2', signalsV2Router);
app.use('/api/chains/status', chainHealthRouter);
app.use('/api/leaderboards', leaderboardsRouter);
app.use('/api/cross-chain-analytics', crossChainAnalyticsRouter);

if (config.NODE_ENV === 'production') {
  const dashboardPath = path.resolve(import.meta.dirname, '../../dashboard/dist');
  app.use(express.static(dashboardPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(dashboardPath, 'index.html'));
  });
}

app.use(errorHandler(log));

let redisClient: import('redis').RedisClientType | null = null;
let wsServer: import('ws').WebSocketServer | null = null;
let server: ReturnType<typeof app.listen> | null = null;
let watchSubscriber: import('redis').RedisClientType | null = null;

export function setRedisClient(client: typeof redisClient): void {
  redisClient = client;
  void startWatchSubscriber();
}

export function setWsServer(wss: typeof wsServer): void {
  wsServer = wss;
}

async function startWatchSubscriber(): Promise<void> {
  if (!redisClient) return;
  try {
    watchSubscriber = redisClient.duplicate();
    await watchSubscriber.connect();
    await watchSubscriber.subscribe('watch:events', (message) => {
      const event = JSON.parse(message) as { eventType: string };
      if (event.eventType === 'NEW_TOKEN') {
        invalidateStatsCache();
        invalidateDeployerCache();
      }
      if (!wsServer) return;
      const payload = JSON.stringify({ type: 'WATCH_EVENT', event });
      for (const client of wsServer.clients) {
        if (client.readyState === 1) {
          client.send(payload);
        }
      }
    });
    log.info('Watch event subscriber started');
  } catch (error) {
    log.error('Failed to start watch subscriber', { error: String(error) });
  }
}

async function shutdown(signal: string): Promise<void> {
  log.info('Shutdown requested', { signal });

  if (watchSubscriber) {
    try {
      await watchSubscriber.unsubscribe('watch:events');
      await watchSubscriber.quit();
    } catch {
      watchSubscriber.disconnect();
    }
    log.info('Watch subscriber stopped');
  }

  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    log.info('HTTP server closed');
  }

  if (redisClient) {
    try {
      await redisClient.quit();
      log.info('Redis disconnected');
    } catch {
      redisClient.disconnect();
    }
  }

  if (wsServer) {
    wsServer.clients.forEach((client) => client.close());
    wsServer.close();
    log.info('WebSocket server closed');
  }

  await prisma.$disconnect();
  log.info('Prisma disconnected');

  log.info('API stopped');
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const httpServer = http.createServer(app);

const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (url.pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

setWsServer(wss);
log.info('WebSocket server attached');

server = httpServer;

httpServer.listen(config.PORT, () => {
  log.info('API listening', { port: config.PORT, env: config.NODE_ENV });
});

export { trackRequest };
