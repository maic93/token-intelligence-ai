import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import type { TokenWithAnalysis, SearchTokensOptions } from '@token-intelligence-ai/database';
import type { ChainName } from '@token-intelligence-ai/blockchain';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

const chainEnum = z.enum(['base', 'robinhood', 'ethereum', 'polygon']);
const sortEnum = z.enum([
  'newest',
  'oldest',
  'highest_risk',
  'lowest_risk',
  'name_asc',
  'name_desc',
]);

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  chain: chainEnum.optional(),
  q: z.string().optional(),
  risk: z.string().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  deployer: z.string().optional(),
  sort: sortEnum.optional(),
  cursor: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const addressParamSchema = z.object({
  chain: chainEnum,
});

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format');

function formatToken(token: TokenWithAnalysis) {
  return {
    contractAddress: token.contractAddress,
    chain: token.chain,
    chainId: token.chainId,
    tokenName: token.name,
    tokenSymbol: token.symbol,
    decimals: token.decimals,
    totalSupply: token.totalSupply,
    metadataConfidence: token.metadataConfidence,
    deployer: token.deployer,
    blockNumber: token.blockNumber.toString(),
    blockTimestamp: token.blockTimestamp.toISOString(),
    transactionHash: token.transactionHash,
    riskScore: token.analysis?.riskScore ?? null,
    riskLevel: token.analysis?.riskLevel ?? null,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);

    if (
      query.q ||
      query.risk ||
      query.minScore !== undefined ||
      query.maxScore !== undefined ||
      query.deployer ||
      query.sort ||
      query.cursor ||
      query.from ||
      query.to
    ) {
      const opts: SearchTokensOptions = {};
      if (query.q) opts.query = query.q;
      if (query.chain) opts.chain = query.chain as ChainName;
      if (query.risk) opts.riskLevel = query.risk;
      if (query.minScore !== undefined) opts.minRiskScore = query.minScore;
      if (query.maxScore !== undefined) opts.maxRiskScore = query.maxScore;
      if (query.deployer) opts.deployer = query.deployer;
      if (query.sort) opts.sort = query.sort;
      if (query.cursor) opts.cursor = query.cursor;
      opts.limit = query.limit;
      if (query.from) opts.fromDate = new Date(query.from);
      if (query.to) opts.toDate = new Date(query.to);

      const result = await tokenRepo.searchTokens(opts);

      res.json({
        data: result.items.map(formatToken),
        nextCursor: result.nextCursor,
        total: result.total,
      });
      return;
    }

    const skip = (query.page - 1) * query.limit;

    const tokens = await tokenRepo.listTokens({
      chain: query.chain as ChainName | undefined,
      limit: query.limit,
      skip,
    });

    res.json({
      data: tokens.map(formatToken),
      nextCursor: tokens.length === query.limit ? String(query.page + 1) : null,
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
      include: {
        analysis: { select: { riskScore: true, riskLevel: true } },
      },
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
