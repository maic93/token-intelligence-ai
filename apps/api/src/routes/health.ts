import { Router, type Router as RouterType } from 'express';
import { prisma } from '@token-intelligence-ai/database';
import { createClient } from 'redis';

const startTimestamp = Date.now();
const pkgVersion = process.env.npm_package_version ?? '0.1.0';

const router: RouterType = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  uptime: number;
  environment: string;
  database: 'connected' | 'disconnected' | 'error';
  redis: 'connected' | 'disconnected' | 'not_configured' | 'error';
  timestamp: string;
}

router.get('/', async (_req, res) => {
  const status: HealthStatus = {
    status: 'healthy',
    service: 'api',
    version: pkgVersion,
    uptime: Math.floor((Date.now() - startTimestamp) / 1000),
    environment: process.env.NODE_ENV ?? 'development',
    database: 'disconnected',
    redis: 'not_configured',
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    status.database = 'connected';
  } catch {
    status.database = 'error';
    status.status = 'degraded';
  }

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const redisClient = createClient({ url: redisUrl });
    try {
      await redisClient.connect();
      await redisClient.ping();
      status.redis = 'connected';
    } catch {
      status.redis = 'error';
      if (status.status !== 'degraded') status.status = 'degraded';
    } finally {
      try {
        await redisClient.disconnect();
      } catch {
        /* ignore */
      }
    }
  }

  const httpCode = status.status === 'healthy' ? 200 : 503;
  res.status(httpCode).json(status);
});

export { router as healthRouter };
