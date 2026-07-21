import { createLogger } from '@token-intelligence-ai/shared';
import {
  prisma,
  AnalysisRepository,
  TokenRepository,
  WalletRepository,
  TrendRepository,
} from '@token-intelligence-ai/database';
import type { ChainConfig } from '@token-intelligence-ai/blockchain';
import { RpcClient } from './rpc.js';
import { BlockProcessor } from './processor.js';
import { ChainHealthMonitor, type HealthStatus } from './chain-health.js';

const log = createLogger('worker-manager');

export interface WorkerHandle {
  chain: string;
  stop: () => void;
}

export class ChainWorkerManager {
  private workers: Map<string, WorkerHandle> = new Map();
  private healthMonitor: ChainHealthMonitor;
  private pollIntervalMs: number;
  private startBlock: number;
  private onStatusChange?: (
    chain: string,
    oldStatus: HealthStatus,
    newStatus: HealthStatus,
  ) => void;

  constructor(opts: {
    pollIntervalMs: number;
    startBlock: number;
    onStatusChange?: (chain: string, oldStatus: HealthStatus, newStatus: HealthStatus) => void;
  }) {
    this.pollIntervalMs = opts.pollIntervalMs;
    this.startBlock = opts.startBlock;
    this.onStatusChange = opts.onStatusChange;
    this.healthMonitor = new ChainHealthMonitor(createLogger('chain-health'), this.onStatusChange);
  }

  getHealthMonitor(): ChainHealthMonitor {
    return this.healthMonitor;
  }

  startWorker(chain: ChainConfig): WorkerHandle {
    if (this.workers.has(chain.name)) {
      log.warn('Worker already running', { chain: chain.name });
      return this.workers.get(chain.name)!;
    }

    const workerLog = createLogger(`indexer:${chain.displayName}`);
    let shuttingDown = false;

    const run = async () => {
      const tokenRepo = new TokenRepository(prisma);
      const analysisRepo = new AnalysisRepository(prisma);
      const walletRepo = new WalletRepository(prisma);
      const trendRepo = new TrendRepository(prisma);
      const rpc = new RpcClient(chain.rpcUrl, workerLog);
      const processor = new BlockProcessor(
        chain,
        rpc,
        tokenRepo,
        analysisRepo,
        walletRepo,
        trendRepo,
        workerLog,
      );

      const currentBlock = await this.resolveStartBlock(tokenRepo, rpc, chain);
      let cursor = currentBlock;
      let liveMode = false;

      workerLog.info('Worker starting', {
        chain: chain.name,
        chainId: chain.chainId,
        rpcUrl: chain.rpcUrl,
        startBlock: this.startBlock,
        pollIntervalMs: this.pollIntervalMs,
        currentBlock: cursor.toString(),
      });

      while (!shuttingDown) {
        try {
          const latestBlock = await rpc.getLatestBlockNumber();
          const latestExpected = latestBlock;
          this.healthMonitor.update(chain.name, rpc, cursor, latestExpected);

          const remaining = latestBlock - cursor;

          if (!liveMode && remaining <= 100n) {
            liveMode = true;
            workerLog.info('Live mode entered', {
              block: cursor.toString(),
              remaining: remaining.toString(),
            });
          }

          if (remaining > 0n) {
            const isCatchUp = remaining > 100n;

            while (cursor < latestBlock && !shuttingDown) {
              cursor += 1n;
              await processor.processBlock(cursor);
              const newRemaining = latestBlock - cursor;

              if (isCatchUp && newRemaining % 100n === 0n) {
                workerLog.info('Progress', {
                  chain: chain.name,
                  block: cursor.toString(),
                  remaining: newRemaining.toString(),
                });
              }
            }
          }
        } catch (error) {
          workerLog.error('Poll cycle error', {
            chain: chain.name,
            worker: chain.displayName,
            error: String(error),
          });
        }

        if (!shuttingDown) {
          await this.sleep(this.pollIntervalMs);
        }
      }

      workerLog.info('Worker stopped', { chain: chain.name });
    };

    run().catch((error) => {
      log.error('Worker failed', {
        chain: chain.name,
        error: String(error),
      });
    });

    const handle: WorkerHandle = {
      chain: chain.name,
      stop: () => {
        shuttingDown = true;
      },
    };

    this.workers.set(chain.name, handle);
    return handle;
  }

  startAll(chains: ChainConfig[]): WorkerHandle[] {
    return chains.map((chain) => this.startWorker(chain));
  }

  stopAll(): void {
    for (const [name, handle] of this.workers) {
      log.info('Stopping worker', { chain: name });
      handle.stop();
    }
    this.workers.clear();
  }

  isRunning(chain: string): boolean {
    return this.workers.has(chain);
  }

  private async resolveStartBlock(
    repo: TokenRepository,
    rpc: RpcClient,
    chain: ChainConfig,
  ): Promise<bigint> {
    const lastBlock = await repo.getLastProcessedBlock(chain.name);
    if (lastBlock !== null) return lastBlock;

    if (this.startBlock > 0) return BigInt(this.startBlock);

    const latest = await rpc.getLatestBlockNumber();
    const nearLive = latest - 5n;
    return nearLive > 0n ? nearLive : 0n;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
