import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma, WalletRepository } from '@token-intelligence-ai/database';
import { analyzeWallet } from '@token-intelligence-ai/analysis';
import type { WalletMetrics } from '@token-intelligence-ai/analysis';

const walletRepo = new WalletRepository(prisma);
const router: RouterType = Router();

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format');
const sortEnum = z.enum([
  'reputation_desc',
  'reputation_asc',
  'deployments_desc',
  'deployments_asc',
  'risk_desc',
  'risk_asc',
  'lastSeen_desc',
  'lastSeen_asc',
]);

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  grade: z.string().optional(),
  label: z.string().optional(),
  sort: sortEnum.optional(),
  search: z.string().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);

    const result = await walletRepo.listWallets({
      page: query.page,
      limit: query.limit,
      grade: query.grade,
      label: query.label,
      sort: query.sort,
      search: query.search,
    });

    res.json({
      data: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const q = z.string().min(2).parse(req.query.q);
    const results = await walletRepo.searchWallet(q);
    res.json({ data: results });
  } catch (error) {
    next(error);
  }
});

router.get('/:address', async (req, res, next) => {
  try {
    const wallet = addressSchema.parse(req.params.address).toLowerCase();

    let profile = await walletRepo.getWallet(wallet);

    if (!profile) {
      const tokens = await prisma.token.findMany({
        where: { deployer: wallet },
        orderBy: { discoveredAt: 'desc' },
        include: {
          analysis: { select: { riskScore: true, riskLevel: true } },
        },
      });

      if (tokens.length === 0) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      const totalRiskScores: number[] = [];
      let highRisk = 0;
      let successful = 0;
      let totalMetaConf = 0;
      let totalAiConf = 0;
      let b20Count = 0;

      for (const t of tokens) {
        totalMetaConf += t.metadataConfidence;
        totalAiConf += t.aiConfidence;
        if (t.isB20) b20Count++;
        if (t.analysis) {
          totalRiskScores.push(t.analysis.riskScore);
          if (t.analysis.riskLevel === 'HIGH' || t.analysis.riskLevel === 'CRITICAL') highRisk++;
          if (t.analysis.riskLevel === 'LOW' || t.analysis.riskLevel === 'SAFE') successful++;
        }
      }

      const firstSeen = tokens.length > 0 ? tokens[tokens.length - 1].discoveredAt : null;
      const lastSeen = tokens.length > 0 ? tokens[0].discoveredAt : null;
      const walletAgeDays = firstSeen
        ? Math.round((Date.now() - firstSeen.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const spanMs = firstSeen && lastSeen ? lastSeen.getTime() - firstSeen.getTime() : 0;
      const deploymentSpanDays = spanMs / (1000 * 60 * 60 * 24);

      const metrics: WalletMetrics = {
        totalDeployments: tokens.length,
        successfulTokens: successful,
        highRiskTokens: highRisk,
        b20Tokens: b20Count,
        averageRisk:
          totalRiskScores.length > 0
            ? Math.round(totalRiskScores.reduce((a, b) => a + b, 0) / totalRiskScores.length)
            : null,
        averageMetadataConfidence: totalMetaConf / tokens.length,
        averageAiConfidence: totalAiConf / tokens.length,
        walletAgeDays,
        deploymentSpanDays,
      };

      const analysis = analyzeWallet(wallet, metrics, firstSeen, lastSeen);

      await walletRepo.updateWallet(wallet, {
        walletAgeDays: analysis.walletAgeDays,
        firstSeen: firstSeen,
        lastSeen: lastSeen,
        totalDeployments: analysis.totalDeployments,
        successfulTokens: analysis.successfulTokens,
        highRiskTokens: analysis.highRiskTokens,
        b20Tokens: analysis.b20Tokens,
        averageRisk: analysis.averageRisk,
        averageMetadataConfidence: analysis.averageMetadataConfidence,
        averageAiConfidence: analysis.averageAiConfidence,
        reputation: analysis.reputation,
        grade: analysis.grade,
        labels: analysis.labels,
        summary: analysis.summary,
      });

      profile = await walletRepo.getWallet(wallet);
    }

    if (!profile) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const riskDistribution = analyzeRiskDistribution(profile);
    const categoryDistribution = analyzeCategoryDistribution(profile);
    const timeline = analyzeTimeline(profile);

    res.json({
      data: {
        ...profile,
        riskDistribution,
        categoryDistribution,
        b20Distribution: {
          total: profile.b20Tokens,
          percentage:
            profile.totalDeployments > 0
              ? Math.round((profile.b20Tokens / profile.totalDeployments) * 100)
              : 0,
        },
        timeline,
      },
    });
  } catch (error) {
    next(error);
  }
});

function analyzeRiskDistribution(profile: { tokens: { riskLevel: string | null }[] }) {
  const dist: Record<string, number> = { SAFE: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const t of profile.tokens) {
    const level = t.riskLevel ?? 'UNKNOWN';
    dist[level] = (dist[level] ?? 0) + 1;
  }
  return dist;
}

function analyzeCategoryDistribution(profile: { tokens: { aiCategory: string }[] }) {
  const dist: Record<string, number> = {};
  for (const t of profile.tokens) {
    const cat = t.aiCategory || 'UNKNOWN';
    dist[cat] = (dist[cat] ?? 0) + 1;
  }
  return dist;
}

function analyzeTimeline(profile: {
  tokens: {
    discoveredAt: string;
    name: string;
    symbol: string;
    riskScore: number | null;
    riskLevel: string | null;
  }[];
}) {
  return profile.tokens.slice(0, 20).map((t) => ({
    date: t.discoveredAt,
    name: t.name,
    symbol: t.symbol,
    riskScore: t.riskScore,
    riskLevel: t.riskLevel,
  }));
}

export { router as walletsRouter };
