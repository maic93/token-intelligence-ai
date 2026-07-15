import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import { createLogger } from '@token-intelligence-ai/shared';
import { loadConfig } from './config.js';
import { RpcClient } from './rpc.js';
import { BlockProcessor } from './processor.js';
import { createPublisher } from './publisher.js';
import { loadAllChainConfigs, type ChainName } from '@token-intelligence-ai/blockchain';
import type { IndexerConfig } from './config.js';

const log = createLogger('indexer');
let shuttingDown = false;

async function resolveStartBlock(
  repo: TokenRepository,
  rpc: RpcClient,
  config: IndexerConfig,
  chain: ChainName,
): Promise<bigint> {
  const lastBlock = await repo.getLastProcessedBlock(chain);
  if (lastBlock !== null) return lastBlock;

  const chainCfg = loadAllChainConfigs().find((c) => c.name === chain);
  if (chainCfg && chainCfg.startBlock > 0) return BigInt(chainCfg.startBlock);

  if (config.startBlock > 0) return BigInt(config.startBlock);

  const latest = await rpc.getLatestBlockNumber();
  const backfill = latest - BigInt(config.backfillBlocks);
  return backfill > 0n ? backfill : 0n;
}

async function processChain(
  chain: ChainName,
  rpcUrl: string,
  tokenRepo: TokenRepository,
  publisher: ReturnType<typeof createPublisher>,
  config: IndexerConfig,
): Promise<void> {
  const rpc = new RpcClient(rpcUrl, log);
  const processor = new BlockProcessor(chain, rpc, tokenRepo, log, publisher);
  let cursor = await resolveStartBlock(tokenRepo, rpc, config, chain);

  const latestBlock = await rpc.getLatestBlockNumber();
  const needsBackfill = cursor < latestBlock;

  if (needsBackfill) {
    log.info('Backfill started', {
      chain,
      from: cursor.toString(),
      to: latestBlock.toString(),
      totalBlocks: (latestBlock - cursor).toString(),
      batchSize: config.backfillBatchSize,
    });

    let current = cursor;
    while (current < latestBlock && !shuttingDown) {
      const batchEnd = current + BigInt(config.backfillBatchSize);
      const end = batchEnd > latestBlock ? latestBlock : batchEnd;

      for (let b = current + 1n; b <= end; b += 1n) {
        if (shuttingDown) break;
        await processor.processBlock(b);
      }

      current = end;
      const remaining = latestBlock - current;
      log.info('Backfill progress', {
        chain,
        current: current.toString(),
        remaining: remaining.toString(),
      });

      if (current < latestBlock && !shuttingDown && config.backfillDelayMs > 0) {
        await sleep(config.backfillDelayMs);
      }
    }

    log.info('Backfill complete', { chain, totalProcessed: (latestBlock - cursor).toString() });
    cursor = latestBlock;
  } else {
    log.info('Cursor at chain tip, skipping backfill', { chain });
  }

  log.info('Live polling started', {
    chain,
    from: cursor.toString(),
    pollIntervalMs: config.pollIntervalMs,
  });

  while (!shuttingDown) {
    try {
      const latest = await rpc.getLatestBlockNumber();
      while (cursor < latest && !shuttingDown) {
        cursor += 1n;
        await processor.processBlock(cursor);
      }
    } catch (error) {
      log.error('Poll cycle error', { chain, error: String(error) });
    }
    if (!shuttingDown) {
      await sleep(config.pollIntervalMs);
    }
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const enabledChains = loadAllChainConfigs();

  log.info('Indexer starting', {
    chains: enabledChains.map((c) => c.name),
    backfillBlocks: config.backfillBlocks,
    backfillBatchSize: config.backfillBatchSize,
    pollIntervalMs: config.pollIntervalMs,
  });

  if (enabledChains.length === 0) {
    log.error('No chains enabled - check RPC URL configuration');
    process.exit(1);
  }

  const publisher = createPublisher(config.redisUrl, log);
  publisher.connect();
  const tokenRepo = new TokenRepository(prisma);

  process.on('SIGTERM', () => {
    log.info('Shutdown requested', { signal: 'SIGTERM' });
    shuttingDown = true;
  });
  process.on('SIGINT', () => {
    log.info('Shutdown requested', { signal: 'SIGINT' });
    shuttingDown = true;
  });

  try {
    await Promise.all(
      enabledChains.map((chainCfg) =>
        processChain(chainCfg.name, chainCfg.rpcUrl, tokenRepo, publisher, config),
      ),
    );
  } finally {
    publisher.disconnect();
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
