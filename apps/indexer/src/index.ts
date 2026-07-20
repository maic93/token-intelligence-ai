import { prisma } from '@token-intelligence-ai/database';
import { createLogger } from '@token-intelligence-ai/shared';
import {
  getEnabledChains,
  loadChainConfig,
  type ChainName,
} from '@token-intelligence-ai/blockchain';
import { config } from './config.js';
import { initWatchPublisher, shutdownWatchPublisher } from './watch-publisher.js';
import { ChainWorkerManager } from './worker-manager.js';

const log = createLogger('indexer');
let shuttingDown = false;

async function main(): Promise<void> {
  const chains = getEnabledChains();

  if (chains.length === 0) {
    log.error('No enabled chains found. Set RPC_URL environment variables for at least one chain.');
    process.exit(1);
  }

  const allNames: ChainName[] = ['base', 'ethereum', 'polygon', 'robinhood'];
  for (const name of allNames) {
    const cfg = loadChainConfig(name);
    if (!cfg.enabled && cfg.rpcUrl) {
      log.info(`${cfg.displayName} worker disabled`, {
        reason: `set ENABLE_${name.toUpperCase()}=true to enable`,
      });
    } else if (!cfg.enabled && !cfg.rpcUrl) {
      log.info(`${cfg.displayName} worker disabled`);
    }
  }

  log.info('Indexer starting', {
    chains: chains.map((c) => `${c.displayName} (chainId: ${c.chainId})`),
    pollIntervalMs: config.POLL_INTERVAL_MS,
  });

  await initWatchPublisher(config.REDIS_URL);

  process.on('SIGTERM', () => {
    log.info('Shutdown requested', { signal: 'SIGTERM' });
    shuttingDown = true;
  });
  process.on('SIGINT', () => {
    log.info('Shutdown requested', { signal: 'SIGINT' });
    shuttingDown = true;
  });

  const workerManager = new ChainWorkerManager({
    pollIntervalMs: config.POLL_INTERVAL_MS,
    startBlock: config.START_BLOCK,
    onStatusChange: (chain, oldStatus, newStatus) => {
      log.info('Chain status changed', { chain, from: oldStatus, to: newStatus });
    },
  });

  try {
    const handles = workerManager.startAll(chains);
    log.info('All workers started', {
      count: handles.length,
      chains: handles.map((h) => h.chain),
    });

    while (!shuttingDown) {
      await sleep(1000);
    }

    workerManager.stopAll();
  } finally {
    log.info('Indexer stopped');
    await shutdownWatchPublisher();
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
