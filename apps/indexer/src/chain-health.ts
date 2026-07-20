import { type Logger } from '@token-intelligence-ai/shared';
import type { RpcClient, RpcMetrics } from './rpc.js';

export type HealthStatus = 'Healthy' | 'Slow' | 'Behind' | 'Offline';

export interface ChainHealth {
  chain: string;
  status: HealthStatus;
  latencyMs: number;
  lastBlock: bigint | null;
  blocksBehind: number | null;
  lastSuccess: number | null;
  lastFailure: number | null;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  updatedAt: number;
}

export class ChainHealthMonitor {
  private health: Map<string, ChainHealth> = new Map();
  private previousStatus: Map<string, HealthStatus> = new Map();

  constructor(
    private readonly log: Logger,
    private readonly onStatusChange?: (
      chain: string,
      oldStatus: HealthStatus,
      newStatus: HealthStatus,
    ) => void,
  ) {}

  update(
    chainName: string,
    rpc: RpcClient,
    latestBlock: bigint | null,
    expectedBlock: bigint | null,
  ): ChainHealth {
    const metrics = rpc.getMetrics();
    const blocksBehind =
      expectedBlock !== null && latestBlock !== null ? Number(expectedBlock - latestBlock) : null;

    const status = this.determineStatus(metrics, blocksBehind);

    const previous = this.previousStatus.get(chainName);
    if (previous && previous !== status) {
      this.log.warn('Chain status changed', {
        chain: chainName,
        from: previous,
        to: status,
        latencyMs: metrics.latencyMs,
        blocksBehind,
      });
      this.onStatusChange?.(chainName, previous, status);
    }

    this.previousStatus.set(chainName, status);

    const health: ChainHealth = {
      chain: chainName,
      status,
      latencyMs: metrics.latencyMs,
      lastBlock: latestBlock,
      blocksBehind,
      lastSuccess: metrics.lastSuccess,
      lastFailure: metrics.lastFailure,
      successCount: metrics.successCount,
      failureCount: metrics.failureCount,
      timeoutCount: metrics.timeoutCount,
      updatedAt: Date.now(),
    };

    this.health.set(chainName, health);
    return health;
  }

  getHealth(chainName: string): ChainHealth | undefined {
    return this.health.get(chainName);
  }

  getAllHealth(): ChainHealth[] {
    return Array.from(this.health.values());
  }

  private determineStatus(metrics: RpcMetrics, blocksBehind: number | null): HealthStatus {
    if (!metrics.isHealthy || metrics.failureCount > metrics.successCount) {
      return 'Offline';
    }
    if (metrics.latencyMs > 10_000) {
      return 'Slow';
    }
    if (blocksBehind !== null && blocksBehind > 100) {
      return 'Behind';
    }
    if (metrics.latencyMs > 2_000) {
      return 'Slow';
    }
    return 'Healthy';
  }
}
