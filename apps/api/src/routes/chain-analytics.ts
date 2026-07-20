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

    const chainArr = configs.map((cfg) => {
      const cursor = cursors.find((c) => c.chain === cfg.name);
      const count = counts.find((c) => c.chain === cfg.name);
      const latestBlock = cursor ? BigInt(cursor.blockNumber) : null;

      const allConfigs = loadAllChainConfigs();
      const highestBlock = allConfigs.reduce((max, c) => {
        const cur = cursors.find((cur) => cur.chain === c.name);
        return cur ? BigInt(cur.blockNumber) : max;
      }, 0n);

      const blocksBehind =
        latestBlock !== null && highestBlock > 0n ? Number(highestBlock - latestBlock) : null;

      return {
        name: cfg.name,
        chainId: cfg.chainId,
        displayName: getChainDisplayName(cfg.name),
        explorerUrl: cfg.explorerUrl,
        nativeCurrency: cfg.nativeCurrency,
        enabled: cfg.enabled,
        tokenCount: count?.count ?? 0,
        deployerCount: 0,
        lastBlock: latestBlock?.toString() ?? null,
        blocksBehind,
        health: cfg.enabled ? 'Healthy' : 'Offline',
        status: cfg.enabled ? 'connected' : 'disabled',
        rpcLatency: null,
        contractsToday: 0,
        contractsHour: 0,
        lastSyncedBlock: cursor ? cursor.blockNumber.toString() : null,
      };
    });

    res.json({
      data: { chains: chainArr, updatedAt: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export { router as chainAnalyticsRouter };
