import { Router, type Router as RouterType } from 'express';
import { prisma, TrendRepository } from '@token-intelligence-ai/database';

const trendRepo = new TrendRepository(prisma);
const router: RouterType = Router();

router.get('/', async (_req, res, next) => {
  try {
    const [hourly, daily, summaries, chainSummaries, topDeployers, topTokens] = await Promise.all([
      trendRepo.getSnapshots('hourly', 24),
      trendRepo.getSnapshots('daily', 30),
      trendRepo.getCategorySummaries(),
      trendRepo.getChainSummaries(),
      trendRepo.getTopDeployers(20),
      trendRepo.getTopTrendingTokens(20),
    ]);

    const overview = {
      tokensToday: daily.length > 0 ? daily[daily.length - 1].tokensIndexed : 0,
      tokensThisHour: hourly.length > 0 ? hourly[hourly.length - 1].tokensIndexed : 0,
      averageRisk: daily.length > 0 ? daily[daily.length - 1].averageRisk : null,
      averageReputation: null,
      averageMetadata: daily.length > 0 ? daily[daily.length - 1].averageMetadataConfidence : null,
      averageAIConfidence: daily.length > 0 ? daily[daily.length - 1].averageAIConfidence : null,
    };

    res.json({
      data: {
        overview,
        hourly: hourly.map((h) => ({
          timestamp: h.timestamp,
          tokensIndexed: h.tokensIndexed,
          highRiskTokens: h.highRiskTokens,
          averageRisk: h.averageRisk,
          averageMetadataConfidence: h.averageMetadataConfidence,
          averageAIConfidence: h.averageAIConfidence,
          uniqueDeployers: h.uniqueDeployers,
        })),
        daily: daily.map((d) => ({
          timestamp: d.timestamp,
          tokensIndexed: d.tokensIndexed,
          highRiskTokens: d.highRiskTokens,
          averageRisk: d.averageRisk,
          averageMetadataConfidence: d.averageMetadataConfidence,
          averageAIConfidence: d.averageAIConfidence,
          uniqueDeployers: d.uniqueDeployers,
        })),
        weekly: [],
        categories: summaries,
        chains: chainSummaries,
        deployers: topDeployers,
        trendingTokens: topTokens,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/deployers', async (_req, res, next) => {
  try {
    const deployers = await trendRepo.getTopDeployers(50);
    res.json({ data: deployers });
  } catch (error) {
    next(error);
  }
});

router.get('/snapshots', async (req, res, next) => {
  try {
    const period = (req.query.period as string) || 'daily';
    const limit = parseInt(req.query.limit as string, 10) || 48;
    if (!['hourly', 'daily', 'weekly'].includes(period)) {
      res.status(400).json({ error: 'period must be hourly, daily, or weekly' });
      return;
    }
    const snapshots = await trendRepo.getSnapshots(period as 'hourly' | 'daily' | 'weekly', limit);
    res.json({ data: { period, snapshots } });
  } catch (error) {
    next(error);
  }
});

router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const trends = await trendRepo.getCategoryTrends(category);
    res.json({ data: { category, trends } });
  } catch (error) {
    next(error);
  }
});

router.get('/chain/:chain', async (req, res, next) => {
  try {
    const { chain } = req.params;
    const trends = await trendRepo.getChainTrends(chain);
    res.json({ data: { chain, trends } });
  } catch (error) {
    next(error);
  }
});

router.get('/deployer/:wallet', async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const trends = await trendRepo.getDeployerTrends(wallet);
    res.json({ data: { wallet, trends } });
  } catch (error) {
    next(error);
  }
});

export { router as trendsRouter };
