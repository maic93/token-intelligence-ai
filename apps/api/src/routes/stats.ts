import { Router, type Router as RouterType } from 'express';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

interface StatsData {
  totalTokens: number;
  recentTokens24h: number;
  uniqueDeployers: number;
  chains: { chain: string; count: number }[];
  cursors: { chain: string; blockNumber: string }[];
  updatedAt: string;
}

let cachedStats: StatsData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10_000;

export function invalidateStatsCache(): void {
  cachedStats = null;
  cacheTimestamp = 0;
}

router.get('/', async (_req, res, next) => {
  try {
    const now = Date.now();
    if (cachedStats && now - cacheTimestamp < CACHE_TTL_MS) {
      res.json({ data: cachedStats });
      return;
    }

    const [totalTokens, recentTokens, chainCounts, deployers, cursors] = await Promise.all([
      tokenRepo.getTokenCount(),
      tokenRepo.getRecentTokenCount(24),
      tokenRepo.getChainCounts(),
      tokenRepo.getUniqueDeployersCount(),
      tokenRepo.getLatestCursors(),
    ]);

    cachedStats = {
      totalTokens,
      recentTokens24h: recentTokens,
      uniqueDeployers: deployers,
      chains: chainCounts,
      cursors: cursors.map((c) => ({ chain: c.chain, blockNumber: c.blockNumber.toString() })),
      updatedAt: new Date().toISOString(),
    };
    cacheTimestamp = now;

    res.json({ data: cachedStats });
  } catch (error) {
    next(error);
  }
});

export { router as statsRouter };
