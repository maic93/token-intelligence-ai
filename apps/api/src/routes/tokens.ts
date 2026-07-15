import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import type { Token } from '@token-intelligence-ai/database';
import type { ChainName } from '@token-intelligence-ai/blockchain';
import { cacheGet, cacheSet, cacheSetToken, buildTokenListKey, buildTokenKey } from '../redis.js';

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

function formatToken(token: Token) {
  return {
    contractAddress: token.contractAddress,
    chain: token.chain,
    tokenName: token.name,
    tokenSymbol: token.symbol,
    decimals: token.decimals,
    totalSupply: token.totalSupply,
    deployer: token.deployer,
    blockNumber: token.blockNumber.toString(),
    blockTimestamp: token.blockTimestamp.toISOString(),
    transactionHash: token.transactionHash,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const offset = (query.page - 1) * query.limit;

    const cacheKey = buildTokenListKey(query.chain, query.page, query.limit);
    const cached = await cacheGet<{ data: unknown; pagination: { page: number; limit: number } }>(
      cacheKey,
    );
    if (cached) {
      res.json(cached);
      return;
    }

    const tokens = await tokenRepo.listTokens({
      chain: query.chain as ChainName | undefined,
      limit: query.limit,
      offset,
    });

    const body = {
      data: tokens.map(formatToken),
      pagination: {
        page: query.page,
        limit: query.limit,
      },
    };

    await cacheSet(cacheKey, body, 15);
    res.json(body);
  } catch (error) {
    next(error);
  }
});

router.get('/:address', async (req, res, next) => {
  try {
    const query = addressParamSchema.parse(req.query);
    const contractAddress = addressSchema.parse(req.params.address);

    const cacheKey = buildTokenKey(query.chain as ChainName, contractAddress.toLowerCase());
    const cached = await cacheGet<{ data: ReturnType<typeof formatToken> }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const token = await tokenRepo.getTokenByAddress(
      query.chain as ChainName,
      contractAddress.toLowerCase(),
    );

    if (!token) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    const body = { data: formatToken(token) };
    await cacheSetToken(cacheKey, body);
    res.json(body);
  } catch (error) {
    next(error);
  }
});

export { router as tokensRouter };
