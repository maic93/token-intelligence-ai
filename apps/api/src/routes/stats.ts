import { Router, type Router as RouterType } from 'express';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

router.get('/', async (_req, res, next) => {
  try {
    const [totalTokens, recentTokens, chainCounts, deployers, cursors] = await Promise.all([
      tokenRepo.getTokenCount(),
      tokenRepo.getRecentTokenCount(24),
      tokenRepo.getChainCounts(),
      tokenRepo.getUniqueDeployersCount(),
      tokenRepo.getLatestCursors(),
    ]);

    res.json({
      data: {
        totalTokens,
        recentTokens24h: recentTokens,
        uniqueDeployers: deployers,
        chains: chainCounts,
        cursors: cursors.map((c) => ({ chain: c.chain, blockNumber: c.blockNumber.toString() })),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as statsRouter };
