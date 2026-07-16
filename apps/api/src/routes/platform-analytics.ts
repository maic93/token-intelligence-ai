import { Router, type Router as RouterType } from 'express';
import { prisma } from '@token-intelligence-ai/database';

const router: RouterType = Router();

router.get('/', async (_req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTokens,
      tokensToday,
      tokensThisWeek,
      tokensThisMonth,
      chainCounts,
      analysisData,
      latestTokens,
    ] = await Promise.all([
      prisma.token.count(),
      prisma.token.count({ where: { discoveredAt: { gte: startOfDay } } }),
      prisma.token.count({ where: { discoveredAt: { gte: startOfWeek } } }),
      prisma.token.count({ where: { discoveredAt: { gte: startOfMonth } } }),
      prisma.token.groupBy({
        by: ['chain'],
        _count: { chain: true },
      }),
      prisma.tokenAnalysis.aggregate({
        _avg: { riskScore: true },
      }),
      prisma.token.findMany({
        orderBy: { discoveredAt: 'desc' },
        take: 5,
        include: {
          analysis: { select: { riskScore: true, riskLevel: true } },
        },
      }),
    ]);

    const riskAgg = await prisma.tokenAnalysis.groupBy({
      by: ['riskLevel'],
      _count: { riskLevel: true },
    });

    const avgRiskScore = analysisData._avg.riskScore ?? null;

    const topDeployers = await getTopDeployers();

    const tokensPerChain = chainCounts.map((c) => ({
      chain: c.chain,
      count: c._count.chain,
    }));

    const riskDistribution: Record<string, number> = {};
    for (const r of riskAgg) {
      riskDistribution[r.riskLevel] = r._count.riskLevel;
    }

    res.json({
      data: {
        totalTokens,
        tokensToday,
        tokensThisWeek,
        tokensThisMonth,
        averageRiskScore: avgRiskScore !== null ? Math.round(avgRiskScore) : null,
        riskDistribution,
        tokensPerChain,
        topDeployers,
        latestTokens: latestTokens.map((t) => ({
          contractAddress: t.contractAddress,
          chain: t.chain,
          tokenName: t.name,
          tokenSymbol: t.symbol,
          riskScore:
            (t as { analysis?: { riskScore?: number } | null }).analysis?.riskScore ?? null,
          riskLevel:
            (t as { analysis?: { riskLevel?: string } | null }).analysis?.riskLevel ?? null,
          discoveredAt: t.discoveredAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

async function getTopDeployers(limit = 5): Promise<{ deployer: string; count: number }[]> {
  const result = await prisma.token.groupBy({
    by: ['deployer'],
    _count: { deployer: true },
    orderBy: { _count: { deployer: 'desc' } },
    take: limit,
  });
  return result.map((r) => ({ deployer: r.deployer, count: r._count.deployer }));
}

export { router as platformAnalyticsRouter };
