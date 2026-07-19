import { PrismaClient, Prisma } from '@prisma/client';
import type { Token } from '@prisma/client';
import type { ChainName } from '@token-intelligence-ai/blockchain';

export interface CreateTokenInput {
  chain: ChainName;
  chainId: number;
  contractAddress: string;
  deployer: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  blockNumber: bigint;
  blockTimestamp: Date;
  transactionHash: string;
  metadataConfidence: number;
}

export interface ListTokensOptions {
  chain?: ChainName;
  limit?: number;
  skip?: number;
}

export interface SearchTokensOptions {
  query?: string;
  chain?: ChainName;
  riskLevel?: string;
  minRiskScore?: number;
  maxRiskScore?: number;
  deployer?: string;
  fromDate?: Date;
  toDate?: Date;
  sort?: 'newest' | 'oldest' | 'highest_risk' | 'lowest_risk' | 'name_asc' | 'name_desc';
  limit?: number;
  cursor?: string;
}

export type TokenWithAnalysis = Token & {
  analysis?: { riskScore: number; riskLevel: string } | null;
};

export interface SearchTokensResult {
  items: TokenWithAnalysis[];
  nextCursor: string | null;
  total: number;
}

export class TokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createToken(input: CreateTokenInput): Promise<Token> {
    return this.prisma.token.create({
      data: {
        chain: input.chain,
        chainId: input.chainId,
        contractAddress: input.contractAddress.toLowerCase(),
        deployer: input.deployer.toLowerCase(),
        name: input.name,
        symbol: input.symbol,
        decimals: input.decimals,
        totalSupply: input.totalSupply,
        metadataConfidence: input.metadataConfidence,
        blockNumber: input.blockNumber,
        blockTimestamp: input.blockTimestamp,
        transactionHash: input.transactionHash,
      },
    });
  }

  async getTokenByAddress(chain: ChainName, contractAddress: string): Promise<Token | null> {
    return this.prisma.token.findUnique({
      where: {
        chain_contractAddress: {
          chain,
          contractAddress: contractAddress.toLowerCase(),
        },
      },
    });
  }

  async tokenExists(chain: ChainName, contractAddress: string): Promise<boolean> {
    const token = await this.prisma.token.findUnique({
      where: {
        chain_contractAddress: {
          chain,
          contractAddress: contractAddress.toLowerCase(),
        },
      },
      select: { id: true },
    });
    return token !== null;
  }

  async listTokens(options: ListTokensOptions = {}): Promise<TokenWithAnalysis[]> {
    const { chain, limit = 50, skip = 0 } = options;

    const where: Prisma.TokenWhereInput = chain ? { chain } : {};

    const findArgs: Prisma.TokenFindManyArgs = {
      where,
      orderBy: { discoveredAt: 'desc' },
      take: limit + 1,
      skip,
      include: {
        analysis: { select: { riskScore: true, riskLevel: true } },
      },
    };

    const items = (await this.prisma.token.findMany(findArgs)) as TokenWithAnalysis[];
    if (items.length > limit) items.pop();
    return items;
  }

  async searchTokens(options: SearchTokensOptions): Promise<SearchTokensResult> {
    const {
      query,
      chain,
      riskLevel,
      minRiskScore,
      maxRiskScore,
      deployer,
      fromDate,
      toDate,
      sort = 'newest',
      limit = 20,
      cursor,
    } = options;

    const where: Prisma.TokenWhereInput = {};

    if (query) {
      const q = query.toLowerCase();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { symbol: { contains: q, mode: 'insensitive' } },
        { contractAddress: { contains: q } },
        { deployer: { contains: q } },
      ];
    }

    if (chain) where.chain = chain;
    if (deployer) where.deployer = deployer.toLowerCase();

    if (fromDate || toDate) {
      where.discoveredAt = {};
      if (fromDate) where.discoveredAt.gte = fromDate;
      if (toDate) where.discoveredAt.lte = toDate;
    }

    const riskFilter: Prisma.TokenAnalysisWhereInput = {};
    if (riskLevel) riskFilter.riskLevel = riskLevel;
    if (minRiskScore !== undefined)
      riskFilter.riskScore = { ...((riskFilter.riskScore as object) || {}), gte: minRiskScore };
    if (maxRiskScore !== undefined)
      riskFilter.riskScore = { ...((riskFilter.riskScore as object) || {}), lte: maxRiskScore };

    if (Object.keys(riskFilter).length > 0) {
      where.analysis = riskFilter as Prisma.TokenAnalysisWhereInput;
    }

    const total = await this.prisma.token.count({ where });

    const orderBy = buildOrderBy(sort);

    const analysisInclude = {
      analysis: {
        select: { riskScore: true, riskLevel: true },
      },
    };

    const findArgs: Prisma.TokenFindManyArgs = {
      where,
      orderBy,
      take: limit + 1,
      include: analysisInclude,
    };

    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    }

    const items = (await this.prisma.token.findMany(findArgs)) as TokenWithAnalysis[];

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { items, nextCursor, total };
  }

  async getTokensByDeployer(deployer: string, chain?: ChainName): Promise<Token[]> {
    const where: Prisma.TokenWhereInput = {
      deployer: deployer.toLowerCase(),
    };
    if (chain) where.chain = chain;

    return this.prisma.token.findMany({
      where,
      orderBy: { discoveredAt: 'desc' },
    });
  }

  async getDeployerSummary(
    deployer: string,
    chain?: ChainName,
  ): Promise<{
    totalContracts: number;
    chains: string[];
    firstDeployment: Date | null;
    latestDeployment: Date | null;
  }> {
    const where: Prisma.TokenWhereInput = {
      deployer: deployer.toLowerCase(),
    };
    if (chain) where.chain = chain;

    const [totalContracts, tokens] = await Promise.all([
      this.prisma.token.count({ where }),
      this.prisma.token.findMany({
        where,
        orderBy: { discoveredAt: 'asc' },
        select: { chain: true, discoveredAt: true },
      }),
    ]);

    const chains = [...new Set(tokens.map((t) => t.chain))];
    const firstDeployment = tokens.length > 0 ? tokens[0].discoveredAt : null;
    const latestDeployment = tokens.length > 0 ? tokens[tokens.length - 1].discoveredAt : null;

    return { totalContracts, chains, firstDeployment, latestDeployment };
  }

  async saveLastProcessedBlock(chain: ChainName, blockNumber: bigint): Promise<void> {
    await this.prisma.syncCursor.upsert({
      where: {
        id_chain: {
          id: `last_block_${chain}`,
          chain,
        },
      },
      update: { blockNumber },
      create: {
        id: `last_block_${chain}`,
        chain,
        blockNumber,
      },
    });
  }

  async getLastProcessedBlock(chain: ChainName): Promise<bigint | null> {
    const cursor = await this.prisma.syncCursor.findUnique({
      where: {
        id_chain: {
          id: `last_block_${chain}`,
          chain,
        },
      },
    });
    return cursor?.blockNumber ?? null;
  }

  async getTokenCount(): Promise<number> {
    return this.prisma.token.count();
  }

  async getRecentTokenCount(hours: number): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.prisma.token.count({
      where: { discoveredAt: { gte: since } },
    });
  }

  async getChainCounts(): Promise<{ chain: string; count: number }[]> {
    const result = await this.prisma.token.groupBy({
      by: ['chain'],
      _count: { chain: true },
    });
    return result.map((r) => ({ chain: r.chain, count: r._count.chain }));
  }

  async getUniqueDeployersCount(): Promise<number> {
    const result = await this.prisma.token.findMany({
      select: { deployer: true },
      distinct: ['deployer'],
    });
    return result.length;
  }

  async getLatestCursors(): Promise<{ chain: string; blockNumber: bigint }[]> {
    const cursors = await this.prisma.syncCursor.findMany();
    return cursors.map((c) => ({ chain: c.chain, blockNumber: c.blockNumber }));
  }
}

function buildOrderBy(
  sort: Required<SearchTokensOptions>['sort'],
): Prisma.TokenOrderByWithRelationInput | Prisma.TokenOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return { discoveredAt: 'desc' };
    case 'oldest':
      return { discoveredAt: 'asc' };
    case 'highest_risk':
      return { analysis: { riskScore: 'desc' } };
    case 'lowest_risk':
      return { analysis: { riskScore: 'asc' } };
    case 'name_asc':
      return { name: 'asc' };
    case 'name_desc':
      return { name: 'desc' };
    default:
      return { discoveredAt: 'desc' };
  }
}
