import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import {
  loadAllChainConfigs,
  getChainDisplayName,
  getChainLogoUrl,
  getChainColorHex,
} from '@token-intelligence-ai/blockchain';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();
const chainEnum = z.enum(['base', 'robinhood', 'ethereum', 'polygon']);

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

router.get('/:chain', async (req, res, next) => {
  try {
    const chainName = chainEnum.parse(req.params.chain);
    const config = loadAllChainConfigs().find((c) => c.name === chainName);
    if (!config) {
      res.status(404).json({ error: 'Chain not found' });
      return;
    }
    const cursor = (await tokenRepo.getLatestCursors()).find((c) => c.chain === chainName);
    const count = (await tokenRepo.getChainCounts()).find((c) => c.chain === chainName);

    res.json({
      data: {
        name: config.name,
        chainId: config.chainId,
        displayName: getChainDisplayName(config.name),
        explorerUrl: config.explorerUrl,
        nativeCurrency: config.nativeCurrency,
        enabled: config.enabled,
        tokenCount: count?.count ?? 0,
        lastSyncedBlock: cursor?.blockNumber.toString() ?? null,
        supportsContracts: config.supportsContracts,
        logo: getChainLogoUrl(config.name),
        color: getChainColorHex(config.name),
        rpcAvailable: config.enabled,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as chainsRouter };
