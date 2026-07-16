import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { TokenRepository, prisma } from '@token-intelligence-ai/database';
import type { TokenWithAnalysis } from '@token-intelligence-ai/database';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  chain: z.enum(['base', 'robinhood', 'ethereum', 'polygon']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const query = searchSchema.parse(req.query);
    const result = await tokenRepo.searchTokens({
      query: query.q,
      chain: query.chain as 'base' | 'robinhood' | 'ethereum' | 'polygon' | undefined,
      limit: query.limit,
      cursor: query.cursor,
    });

    res.json({
      data: result.items.map(formatToken),
      nextCursor: result.nextCursor,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
});

export { router as searchRouter };

function formatToken(token: TokenWithAnalysis): {
  contractAddress: string;
  chain: string;
  chainId: number;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  totalSupply: string;
  deployer: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  riskScore: number | null;
  riskLevel: string | null;
} {
  return {
    contractAddress: token.contractAddress,
    chain: token.chain,
    chainId: token.chainId,
    tokenName: token.name,
    tokenSymbol: token.symbol,
    decimals: token.decimals,
    totalSupply: token.totalSupply,
    deployer: token.deployer,
    blockNumber: token.blockNumber.toString(),
    blockTimestamp: token.blockTimestamp.toISOString(),
    transactionHash: token.transactionHash,
    riskScore: token.analysis?.riskScore ?? null,
    riskLevel: token.analysis?.riskLevel ?? null,
  };
}
