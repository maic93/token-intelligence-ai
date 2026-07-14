import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import { createLogger } from '@token-intelligence-ai/shared';
import { loadConfig } from './config.js';
import { RpcClient } from './rpc.js';
import { BlockProcessor } from './processor.js';
import type { IndexerConfig } from './config.js';

const log = createLogger('indexer');
let shuttingDown = false;

async function resolveStartBlock(
  repo: TokenRepository,
  rpc: RpcClient,
  config: IndexerConfig,
): Promise<bigint> {
  const lastBlock = await repo.getLastProcessedBlock('base');
  if (lastBlock !== null) return lastBlock;

  if (config.startBlock > 0) return BigInt(config.startBlock);

  const latest = await rpc.getLatestBlockNumber();
  const backfill = latest - BigInt(config.backfillBlocks);
  return backfill > 0n ? backfill : 0n;
}

async function main(): Promise<void> {
  const config = loadConfig();

  log.info('Indexer starting', {
    baseRpcUrl: config.baseRpcUrl,
    startBlock: config.startBlock,
    backfillBlocks: config.backfillBlocks,
    pollIntervalMs: config.pollIntervalMs,
  });

  const tokenRepo = new TokenRepository(prisma);
  const rpc = new RpcClient(config.baseRpcUrl, log);
  const processor = new BlockProcessor(rpc, tokenRepo, log);

  const currentBlock = await resolveStartBlock(tokenRepo, rpc, config);

  log.info('Block sync starting', { currentBlock: currentBlock.toString() });

  process.on('SIGTERM', () => {
    log.info('Shutdown requested', { signal: 'SIGTERM' });
    shuttingDown = true;
  });
  process.on('SIGINT', () => {
    log.info('Shutdown requested', { signal: 'SIGINT' });
    shuttingDown = true;
  });

  let cursor = currentBlock;

  try {
    while (!shuttingDown) {
      try {
        const latestBlock = await rpc.getLatestBlockNumber();

        while (cursor < latestBlock && !shuttingDown) {
          cursor += 1n;
          await processor.processBlock(cursor);
          log.info('Current block', { blockNumber: cursor.toString() });
        }
      } catch (error) {
        log.error('Poll cycle error', { error: String(error) });
      }

      if (!shuttingDown) {
        await sleep(config.pollIntervalMs);
      }
    }
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
