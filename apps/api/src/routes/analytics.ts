import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { AnalyticsOrchestrator } from '@token-intelligence-ai/analytics';
import { getChainConfig } from '@token-intelligence-ai/blockchain';
import { createLogger } from '@token-intelligence-ai/shared';

const log = createLogger('api:analytics');
const router: RouterType = Router();

const chainEnum = z.enum(['base', 'robinhood', 'ethereum', 'polygon']);

const paramsSchema = z.object({
  chain: chainEnum,
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format'),
});

let orchestrator: AnalyticsOrchestrator | null = null;

export function initAnalytics(redisUrl?: string): void {
  orchestrator = new AnalyticsOrchestrator(redisUrl);
  log.info('Analytics orchestrator initialized', { redisConfigured: !!redisUrl });
}

router.get('/:chain/:address', async (req, res, next) => {
  try {
    const params = paramsSchema.parse({
      chain: req.params.chain,
      address: req.params.address,
    });

    const chainCfg = getChainConfig(params.chain);
    if (!chainCfg.enabled) {
      res.status(400).json({ error: `Chain '${params.chain}' is not configured` });
      return;
    }

    if (!orchestrator) {
      res.status(503).json({ error: 'Analytics engine not initialized' });
      return;
    }

    const report = await orchestrator.getReport(params.chain, params.address.toLowerCase());

    res.json({ data: report });
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRouter };
