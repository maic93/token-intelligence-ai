import { Router, type Router as RouterType } from 'express';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import {
  loadAllChainConfigs,
  getChainDisplayName,
  getChainColorHex,
  getChainLogoUrl,
} from '@token-intelligence-ai/blockchain';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

interface ChainHealthEntry {
  name: string;
  chainId: number;
  displayName: string;
  explorerUrl: string;
  enabled: boolean;
  connected: boolean;
  logo: string;
  color: string;
  currentBlock: string | null;
  lastIndexedBlock: string | null;
  blocksBehind: number | null;
  rpcLatency: number | null;
  tokenCount: number;
  workerStatus: string;
  errors: string[];
  lastUpdated: string;
}

router.get('/', async (_req, res, next) => {
  try {
    const configs = loadAllChainConfigs();
    const cursors = await tokenRepo.getLatestCursors();
    const counts = await tokenRepo.getChainCounts();

    const result: ChainHealthEntry[] = configs.map((cfg) => {
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
        enabled: cfg.enabled,
        connected: cfg.enabled && !!cfg.rpcUrl,
        logo: getChainLogoUrl(cfg.name),
        color: getChainColorHex(cfg.name),
        currentBlock: null,
        lastIndexedBlock: latestBlock?.toString() ?? null,
        blocksBehind,
        rpcLatency: null,
        tokenCount: count?.count ?? 0,
        workerStatus: cfg.enabled ? 'running' : 'stopped',
        errors: [],
        lastUpdated: new Date().toISOString(),
      };
    });

    res.json({ data: { chains: result, updatedAt: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
});

export { router as chainHealthRouter };
