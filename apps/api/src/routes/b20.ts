import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import type { TokenWithAnalysis } from '@token-intelligence-ai/database';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

function formatB20Token(token: TokenWithAnalysis) {
  return {
    contractAddress: token.contractAddress,
    chain: token.chain,
    chainId: token.chainId,
    tokenName: token.name,
    tokenSymbol: token.symbol,
    decimals: token.decimals,
    totalSupply: token.totalSupply,
    metadataConfidence: token.metadataConfidence,
    isB20: token.isB20,
    b20Confidence: token.b20Confidence,
    deployer: token.deployer,
    blockNumber: token.blockNumber.toString(),
    blockTimestamp: token.blockTimestamp.toISOString(),
    transactionHash: token.transactionHash,
    riskScore: token.analysis?.riskScore ?? null,
    riskLevel: token.analysis?.riskLevel ?? null,
  };
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  minConfidence: z.coerce.number().int().min(0).max(100).optional(),
  sort: z.enum(['confidence_desc', 'confidence_asc', 'newest', 'oldest']).optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    const tokens = await tokenRepo.listB20Tokens({
      limit: query.limit,
      skip,
      minConfidence: query.minConfidence,
      sort: query.sort,
    });

    const analytics = await tokenRepo.getB20Analytics();

    res.json({
      data: tokens.map(formatB20Token),
      analytics: {
        totalB20Tokens: analytics.totalB20Tokens,
        averageConfidence: analytics.averageConfidence,
        highestConfidence: analytics.highestConfidence,
        newestB20: analytics.newestB20 ? formatB20Token(analytics.newestB20) : null,
        detectedToday: analytics.detectedToday,
        detectedHour: analytics.detectedHour,
        topCreator: analytics.topCreator,
        highestRisk: analytics.highestRisk ? formatB20Token(analytics.highestRisk) : null,
      },
      pagination: { page: query.page, limit: query.limit },
    });
  } catch (error) {
    next(error);
  }
});

export { router as b20Router };
