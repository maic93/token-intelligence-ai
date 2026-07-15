import { Router, type Router as RouterType } from 'express';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import { loadAllChainConfigs, getChainDisplayName } from '@token-intelligence-ai/blockchain';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

router.get('/', async (_req, res, next) => {
  try {
    const configs = loadAllChainConfigs();
    const cursors = await tokenRepo.getLatestCursors();
    const counts = await tokenRepo.getChainCounts();

    const chains = configs.map((cfg) => {
      const cursor = cursors.find((c) => c.chain === cfg.name);
      const count = counts.find((c) => c.chain === cfg.name);
      return {
        name: cfg.name,
        chainId: cfg.chainId,
        displayName: getChainDisplayName(cfg.name),
        explorerUrl: cfg.explorerUrl,
        nativeCurrency: cfg.nativeCurrency,
        enabled: cfg.enabled,
        tokenCount: count?.count ?? 0,
        lastSyncedBlock: cursor ? cursor.blockNumber.toString() : null,
        rpcAvailable: cfg.enabled,
      };
    });

    res.json({
      data: { chains, updatedAt: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export { router as chainsRouter };
