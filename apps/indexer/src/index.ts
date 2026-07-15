import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import { createLogger } from '@token-intelligence-ai/shared';
import type { Logger } from '@token-intelligence-ai/shared';
import { getEnabledChains, type ChainConfig } from '@token-intelligence-ai/blockchain';
import { loadConfig, type IndexerConfig } from './config.js';
import { RpcClient } from './rpc.js';
import { BlockProcessor } from './processor.js';

const log = createLogger('indexer');
let shuttingDown = false;

async function resolveStartBlock(
  repo: TokenRepository,
  rpc: RpcClient,
  chain: ChainConfig,
  startBlock: number,
  backfillBlocks: number,
): Promise<bigint> {
  const lastBlock = await repo.getLastProcessedBlock(chain.name);
  if (lastBlock !== null) return lastBlock;

  if (startBlock > 0) return BigInt(startBlock);

  const latest = await rpc.getLatestBlockNumber();
  const backfill = latest - BigInt(backfillBlocks);
  return backfill > 0n ? backfill : 0n;
}

async function runWorker(chain: ChainConfig, config: IndexerConfig): Promise<void> {
  const workerLog: Logger = createLogger(`indexer:${chain.displayName}`);
  const tokenRepo = new TokenRepository(prisma);
  const rpc = new RpcClient(chain.rpcUrl, workerLog);
  const processor = new BlockProcessor(chain, rpc, tokenRepo, workerLog);

  const currentBlock = await resolveStartBlock(
    tokenRepo,
    rpc,
    chain,
    config.startBlock,
    config.backfillBlocks,
  );

  workerLog.info('Worker starting', {
    chain: chain.name,
    chainId: chain.chainId,
    rpcUrl: chain.rpcUrl,
    startBlock: config.startBlock,
    backfillBlocks: config.backfillBlocks,
    pollIntervalMs: config.pollIntervalMs,
    currentBlock: currentBlock.toString(),
  });

  let cursor = currentBlock;

  while (!shuttingDown) {
    try {
      const latestBlock = await rpc.getLatestBlockNumber();

      while (cursor < latestBlock && !shuttingDown) {
        cursor += 1n;
        await processor.processBlock(cursor);
        workerLog.info('Block processed', {
          chain: chain.name,
          worker: chain.displayName,
          block: cursor.toString(),
          latest: latestBlock.toString(),
          remaining: (latestBlock - cursor).toString(),
        });
      }
    } catch (error) {
      workerLog.error('Poll cycle error', {
        chain: chain.name,
        worker: chain.displayName,
        error: String(error),
      });
    }

    if (!shuttingDown) {
      await sleep(config.pollIntervalMs);
    }
  }

  workerLog.info('Worker stopped', { chain: chain.name });
}

async function main(): Promise<void> {
  const config = loadConfig();
  const chains = getEnabledChains();

  if (chains.length === 0) {
    log.error('No enabled chains found. Set RPC_URL environment variables for at least one chain.');
    process.exit(1);
  }

  log.info('Indexer starting', {
    chains: chains.map((c) => `${c.displayName} (chainId: ${c.chainId})`),
    pollIntervalMs: config.pollIntervalMs,
  });

  process.on('SIGTERM', () => {
    log.info('Shutdown requested', { signal: 'SIGTERM' });
    shuttingDown = true;
  });
  process.on('SIGINT', () => {
    log.info('Shutdown requested', { signal: 'SIGINT' });
    shuttingDown = true;
  });

  try {
    const workers = chains.map((chain) =>
      runWorker(chain, config).catch((error) => {
        log.error('Worker failed', {
          chain: chain.name,
          error: String(error),
        });
      }),
    );

    await Promise.all(workers);
  } finally {
    log.info('Indexer stopped');
    await prisma.$disconnect();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  log.error('Fatal error', { error: String(error) });
  process.exit(1);
});
