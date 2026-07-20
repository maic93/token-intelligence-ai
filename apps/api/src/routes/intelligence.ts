import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format');

router.get('/', async (req, res, next) => {
  try {
    const category = req.query.category as string | undefined;
    const recommendation = req.query.recommendation as string | undefined;
    const chain = req.query.chain as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const tokens = await tokenRepo.listIntelligenceTokens({
      category,
      recommendation,
      chain,
      limit,
      offset,
    });

    const total = await prisma.token.count();
    const categoryCounts = await prisma.token.groupBy({
      by: ['aiCategory'],
      _count: true,
    });
    const recommendationCounts = await prisma.token.groupBy({
      by: ['aiRecommendation'],
      _count: true,
    });

    res.json({
      data: tokens.map((t) => ({
        id: t.id,
        contractAddress: t.contractAddress,
        chain: t.chain,
        name: t.name,
        symbol: t.symbol,
        aiCategory: t.aiCategory,
        aiRecommendation: t.aiRecommendation,
        aiConfidence: t.aiConfidence,
        aiSummary: t.aiSummary,
        deployerReputation: t.deployerReputation,
        deployerGrade: t.deployerGrade,
        discoveredAt: t.discoveredAt.toISOString(),
      })),
      pagination: { total, limit, offset },
      aggregations: {
        categories: Object.fromEntries(categoryCounts.map((c) => [c.aiCategory, c._count])),
        recommendations: Object.fromEntries(
          recommendationCounts.map((c) => [c.aiRecommendation, c._count]),
        ),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:contract', async (req, res, next) => {
  try {
    const contractAddress = addressSchema.parse(req.params.contract).toLowerCase();
    const chainStr = req.query.chain as string | undefined;
    const chainName = (chainStr || 'base') as 'base' | 'robinhood' | 'ethereum' | 'polygon';
    const token = await tokenRepo.getTokenIntelligence(chainName, contractAddress);
    if (!token) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    res.json({
      data: {
        contractAddress: token.contractAddress,
        chain: token.chain,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        totalSupply: token.totalSupply,
        aiCategory: token.aiCategory,
        aiRecommendation: token.aiRecommendation,
        aiConfidence: token.aiConfidence,
        aiSummary: token.aiSummary,
        deployerReputation: token.deployerReputation,
        deployerGrade: token.deployerGrade,
        metadataConfidence: token.metadataConfidence,
        isB20: token.isB20,
        b20Confidence: token.b20Confidence,
        discoveredAt: token.discoveredAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as intelligenceRouter };
