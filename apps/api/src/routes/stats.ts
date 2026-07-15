import { Router, type Router as RouterType } from 'express';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import { cacheGet, cacheSet } from '../redis.js';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

const CACHE_TTL = 30;

router.get('/', async (_req, res, next) => {
  try {
    const cached = await cacheGet<Record<string, unknown>>('stats:platform');
    if (cached) {
      res.json({ data: cached });
      return;
    }

    const [totalTokens, recentTokens, chainCounts, deployers, cursors] = await Promise.all([
      tokenRepo.getTokenCount(),
      tokenRepo.getRecentTokenCount(24),
      tokenRepo.getChainCounts(),
      tokenRepo.getUniqueDeployersCount(),
      tokenRepo.getLatestCursors(),
    ]);

    const stats = {
      totalTokens,
      recentTokens24h: recentTokens,
      uniqueDeployers: deployers,
      chains: chainCounts,
      cursors: cursors.map((c) => ({ chain: c.chain, blockNumber: c.blockNumber.toString() })),
      updatedAt: new Date().toISOString(),
    };

    await cacheSet('stats:platform', stats, CACHE_TTL);
    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
});

export { router as statsRouter };
