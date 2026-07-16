import { Router, type Router as RouterType } from 'express';
import { prisma } from '@token-intelligence-ai/database';
import { loadAllChainConfigs } from '@token-intelligence-ai/blockchain';
import { createClient } from 'redis';

const router: RouterType = Router();

router.get('/', async (_req, res) => {
  let database = false;
  let redis = false;
  let chainsConfigured = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    /* not ready */
  }

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const redisClient = createClient({ url: redisUrl });
    try {
      await redisClient.connect();
      await redisClient.ping();
      redis = true;
    } catch {
      /* not ready */
    } finally {
      try {
        await redisClient.disconnect();
      } catch {
        /* ignore */
      }
    }
  }

  const chains = loadAllChainConfigs();
  chainsConfigured = chains.filter((c) => c.enabled).length;

  const ready = database && chainsConfigured > 0;

  res.status(ready ? 200 : 503).json({
    ready,
    database,
    redis: redisUrl ? redis : 'not_configured',
    chainsConfigured,
    timestamp: new Date().toISOString(),
  });
});

export { router as readyRouter };
