import { Router, type Router as RouterType } from 'express';
import {
  prisma,
  SmartMoneyRepository,
  FundingRepository,
  TrendRepository,
} from '@token-intelligence-ai/database';

const smartMoneyRepo = new SmartMoneyRepository(prisma);
const fundingRepo = new FundingRepository(prisma);
const trendRepo = new TrendRepository(prisma);
const router: RouterType = Router();

router.get('/', async (_req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const [
      totalTokens,
      tokensToday,
      tokensThisWeek,
      chainCounts,
      chainData,
      signalAgg,
      smOverview,
      fundingOverview,
      dailySnapshots,
    ] = await Promise.all([
      prisma.token.count(),
      prisma.token.count({ where: { discoveredAt: { gte: startOfDay } } }),
      prisma.token.count({ where: { discoveredAt: { gte: startOfWeek } } }),
      prisma.token.groupBy({ by: ['chain'], _count: { chain: true } }),
      prisma.token.groupBy({
        by: ['chain'],
        _avg: { metadataConfidence: true, b20Confidence: true },
        _count: { chain: true },
      }),
      prisma.signal.aggregate({
        _avg: { opportunityScore: true, riskScore: true, confidence: true },
      }),
      smartMoneyRepo.overview(),
      fundingRepo.overview(),
      trendRepo.getSnapshots('daily', 14),
    ]);

    const mostActiveChain = [...chainCounts].sort((a, b) => b._count.chain - a._count.chain)[0];

    const chainAggs = chainData.map((c) => ({
      chain: c.chain,
      tokenCount: c._count.chain,
      avgMetadataConfidence: Math.round(c._avg.metadataConfidence ?? 0),
      avgB20Confidence: Math.round(c._avg.b20Confidence ?? 0),
    }));

    res.json({
      data: {
        summary: {
          totalTokens,
          tokensToday,
          tokensThisWeek,
          totalChains: chainCounts.length,
          mostActiveChain: mostActiveChain?.chain ?? null,
          mostActiveChainCount: mostActiveChain?._count.chain ?? 0,
        },
        chains: chainAggs,
        averages: {
          avgOpportunityScore: Math.round(signalAgg._avg.opportunityScore ?? 0),
          avgRiskScore: Math.round(signalAgg._avg.riskScore ?? 0),
          avgConfidence: Math.round(signalAgg._avg.confidence ?? 0),
          avgSmartMoneyScore: smOverview.averageScore,
          averageFundingAmount:
            fundingOverview.total > 0
              ? Math.round((fundingOverview.fundedCount / fundingOverview.total) * 100) / 100
              : 0,
        },
        smartMoney: smOverview,
        funding: fundingOverview,
        dailyTrend: dailySnapshots.map((s) => ({
          date: s.timestamp.toISOString().slice(0, 10),
          tokensIndexed: s.tokensIndexed,
          uniqueDeployers: s.uniqueDeployers,
        })),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as crossChainAnalyticsRouter };
