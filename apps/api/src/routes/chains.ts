import { Router, type Router as RouterType } from 'express';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import { loadAllChainConfigs, getChainDisplayName } from '@token-intelligence-ai/blockchain';
import { cacheGet, cacheSet } from '../redis.js';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

const CACHE_TTL = 30;

router.get('/', async (_req, res, next) => {
  try {
    const cached = await cacheGet<Record<string, unknown>>('stats:chains');
    if (cached) {
      res.json({ data: cached });
      return;
    }

    const configs = loadAllChainConfigs();
    const cursors = await tokenRepo.getLatestCursors();
    const counts = await tokenRepo.getChainCounts();

    const chains = configs.map((cfg) => {
      const cursor = cursors.find((c) => c.chain === cfg.name);
      const count = counts.find((c) => c.chain === cfg.name);
      return {
        name: cfg.name,
        displayName: getChainDisplayName(cfg.name),
        enabled: cfg.enabled,
        tokenCount: count?.count ?? 0,
        lastSyncedBlock: cursor ? cursor.blockNumber.toString() : null,
      };
    });

    const result = { chains, updatedAt: new Date().toISOString() };
    await cacheSet('stats:chains', result, CACHE_TTL);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

export { router as chainsRouter };
