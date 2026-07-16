import { createLogger } from '@token-intelligence-ai/shared';
import type { ChainName } from '@token-intelligence-ai/blockchain';
import { createAnalyticsCache, type AnalyticsCache } from './cache.js';
import {
  collectTokenAnalytics,
  collectLiquidityAnalytics,
  collectHolderAnalytics,
  collectTransactionAnalytics,
  collectDeployerAnalytics,
  collectChainAnalytics,
} from './collectors.js';
import type { AnalyticsReport } from './types.js';

const log = createLogger('analytics:orchestrator');
const ANALYTICS_VERSION = '0.1.0';

export class AnalyticsOrchestrator {
  private readonly cache: AnalyticsCache;

  constructor(redisUrl?: string) {
    this.cache = createAnalyticsCache(redisUrl);
  }

  async getReport(chain: ChainName, address: string): Promise<AnalyticsReport> {
    const cacheKey = this.cache.buildKey(chain, address);
    const startTime = Date.now();

    const cached = await this.cache.get<AnalyticsReport>(cacheKey);
    if (cached) {
      log.info('Analytics report served from cache', {
        chain,
        address,
        durationMs: Date.now() - startTime,
      });
      return cached;
    }

    log.info('Analytics report cache miss', { chain, address });

    const [
      tokenAnalytics,
      liquidityAnalytics,
      holderAnalytics,
      transactionAnalytics,
      deployerAnalytics,
      chainAnalytics,
    ] = await Promise.all([
      collectTokenAnalytics(chain, address),
      collectLiquidityAnalytics(),
      collectHolderAnalytics(),
      collectTransactionAnalytics(),
      collectDeployerAnalytics(chain, address),
      collectChainAnalytics(chain),
    ]);

    const report: AnalyticsReport = {
      token: {
        contractAddress: address,
        chain,
      },
      chain,
      tokenAnalytics,
      holderAnalytics,
      liquidityAnalytics,
      transactionAnalytics,
      deployerAnalytics,
      chainAnalytics,
      generatedAt: new Date().toISOString(),
      version: ANALYTICS_VERSION,
    };

    await this.cache.set(cacheKey, report);

    const durationMs = Date.now() - startTime;
    log.info('Analytics report generated', { chain, address, durationMs });

    return report;
  }
}
