import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import type { Token } from '@token-intelligence-ai/database';
import type { ChainName } from '@token-intelligence-ai/blockchain';
const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

const chainEnum = z.enum(['base', 'robinhood', 'ethereum', 'polygon']);

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  chain: chainEnum.optional(),
});

const addressParamSchema = z.object({
  chain: chainEnum,
});

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format');

type TokenWithAnalysis = Token & { analysis?: { riskScore: number; riskLevel: string } | null };

function formatToken(token: TokenWithAnalysis) {
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

const includeAnalysis = {
  analysis: {
    select: { riskScore: true, riskLevel: true },
  },
};

router.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const offset = (query.page - 1) * query.limit;

    const tokens = await tokenRepo.listTokens({
      chain: query.chain as ChainName | undefined,
      limit: query.limit,
      offset,
    });

    const enriched = await prisma.token.findMany({
      where: { id: { in: tokens.map((t) => t.id) } },
      orderBy: { discoveredAt: 'desc' },
      include: includeAnalysis,
    });

    res.json({
      data: enriched.map(formatToken),
      pagination: { page: query.page, limit: query.limit },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:address', async (req, res, next) => {
  try {
    const query = addressParamSchema.parse(req.query);
    const contractAddress = addressSchema.parse(req.params.address);

    const token = await prisma.token.findUnique({
      where: {
        chain_contractAddress: {
          chain: query.chain as string,
          contractAddress: contractAddress.toLowerCase(),
        },
      },
      include: includeAnalysis,
    });

    if (!token) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    res.json({ data: formatToken(token) });
  } catch (error) {
    next(error);
  }
});

export { router as tokensRouter };
