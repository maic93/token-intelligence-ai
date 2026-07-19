import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import { calculateDeployerReputation } from '@token-intelligence-ai/analysis';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format');
const chainEnum = z.enum(['base', 'robinhood', 'ethereum', 'polygon']).optional();

interface CachedDeployersList {
  data: unknown[];
  timestamp: number;
}

let cachedTop: CachedDeployersList | null = null;
let cachedWorst: CachedDeployersList | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10_000;

function invalidateDeployerCache(): void {
  cachedTop = null;
  cachedWorst = null;
  cacheTimestamp = 0;
}

router.get('/', async (req, res, next) => {
  try {
    const now = Date.now();
    if (cachedTop && now - cacheTimestamp < CACHE_TTL_MS) {
      res.json({ top: cachedTop.data, worst: cachedWorst?.data ?? [] });
      return;
    }

    const [topDeployers, worstDeployers, overview] = await Promise.all([
      tokenRepo.listTopDeployers(10),
      tokenRepo.listWorstDeployers(10),
      tokenRepo.getDeployerOverview(),
    ]);

    const format = (d: {
      wallet: string;
      tokensCreated: number;
      reputationScore: number;
      reputationGrade: string;
      avgRiskScore: number | null;
      avgMetadataConfidence: number;
      avgB20Confidence: number;
      firstSeen: Date | null;
      lastSeen: Date | null;
    }) => ({
      wallet: d.wallet,
      tokensCreated: d.tokensCreated,
      reputationScore: d.reputationScore,
      reputationGrade: d.reputationGrade,
      avgRiskScore: d.avgRiskScore,
      avgMetadataConfidence: Math.round(d.avgMetadataConfidence),
      avgB20Confidence: Math.round(d.avgB20Confidence),
      firstSeen: d.firstSeen?.toISOString() ?? null,
      lastSeen: d.lastSeen?.toISOString() ?? null,
    });

    const topData = topDeployers.map(format);
    const worstData = worstDeployers.map(format);

    cachedTop = { data: topData, timestamp: now };
    cachedWorst = { data: worstData, timestamp: now };
    cacheTimestamp = now;

    res.json({
      top: topData,
      worst: worstData,
      overview: {
        averageCreatorReputation: overview.averageCreatorReputation,
        worstCreator: overview.worstCreator,
        bestCreator: overview.bestCreator,
        repeatDeployers: overview.repeatDeployers,
        totalDeployers: overview.totalDeployers,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:address', async (req, res, next) => {
  try {
    const deployer = addressSchema.parse(req.params.address).toLowerCase();
    const chain = req.query.chain as string | undefined;
    const parsedChain = chain
      ? (chainEnum.parse(chain) as 'base' | 'robinhood' | 'ethereum' | 'polygon')
      : undefined;

    const tokens = await tokenRepo.getTokensByDeployer(deployer, parsedChain);
    const summary = await tokenRepo.getDeployerSummary(deployer, parsedChain);

    if (tokens.length === 0) {
      res.status(404).json({ error: 'No tokens found for this deployer' });
      return;
    }

    const stats = await tokenRepo.computeDeployerAnalytics(deployer, parsedChain);
    const reputation = calculateDeployerReputation({
      totalTokens: stats.tokensCreated,
      lowRiskTokens: stats.lowRiskTokens,
      mediumRiskTokens: stats.mediumRiskTokens,
      highRiskTokens: stats.highRiskTokens,
      avgRiskScore: stats.avgRiskScore,
      avgMetadataConfidence: stats.avgMetadataConfidence,
      avgB20Confidence: stats.avgB20Confidence,
      uniqueNames: stats.uniqueNames,
      uniqueSymbols: stats.uniqueSymbols,
      duplicateNames: stats.duplicateNames,
      duplicateSymbols: stats.duplicateSymbols,
      deploymentSpanDays: stats.deploymentSpanDays,
    });

    const analytics = await tokenRepo.upsertDeployerAnalytics(
      deployer,
      reputation.score,
      reputation.grade,
      parsedChain,
    );

    const tokenIds = tokens.map((t) => t.id);
    const analyses = await prisma.tokenAnalysis.findMany({
      where: { tokenId: { in: tokenIds } },
      select: { tokenId: true, riskScore: true, riskLevel: true },
    });
    const analysisMap = new Map(analyses.map((a) => [a.tokenId, a]));

    const riskScores = analyses.map((a) => a.riskScore);
    const averageRisk =
      riskScores.length > 0
        ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length)
        : null;

    const b20Tokens = tokens.filter((t) => t.isB20).length;

    res.json({
      data: {
        deployer,
        reputation: {
          score: reputation.score,
          grade: reputation.grade,
          reasons: reputation.reasons,
        },
        totalContracts: summary.totalContracts,
        chains: summary.chains,
        firstDeployment: summary.firstDeployment?.toISOString() ?? null,
        latestDeployment: summary.latestDeployment?.toISOString() ?? null,
        averageRisk,
        b20Tokens,
        analytics: {
          highRisk: analytics.highRiskTokens,
          mediumRisk: analytics.mediumRiskTokens,
          lowRisk: analytics.lowRiskTokens,
          avgRiskScore: analytics.avgRiskScore,
          avgMetadataConfidence: Math.round(analytics.avgMetadataConfidence),
          avgB20Confidence: Math.round(analytics.avgB20Confidence),
          uniqueSymbols: analytics.uniqueSymbols,
          firstSeen: analytics.firstSeen?.toISOString() ?? null,
          lastSeen: analytics.lastSeen?.toISOString() ?? null,
        },
        tokens: tokens.map((t) => {
          const analysis = analysisMap.get(t.id);
          return {
            contractAddress: t.contractAddress,
            chain: t.chain,
            tokenName: t.name,
            tokenSymbol: t.symbol,
            blockNumber: t.blockNumber.toString(),
            blockTimestamp: t.blockTimestamp.toISOString(),
            riskScore: analysis?.riskScore ?? null,
            riskLevel: analysis?.riskLevel ?? null,
            b20Confidence: t.b20Confidence,
            isB20: t.isB20,
          };
        }),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as deployersRouter, invalidateDeployerCache };
