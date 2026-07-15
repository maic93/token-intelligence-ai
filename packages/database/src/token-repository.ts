import { PrismaClient, Token, Prisma } from '@prisma/client';
import type { ChainName } from '@token-intelligence-ai/blockchain';

export interface CreateTokenInput {
  chain: ChainName;
  contractAddress: string;
  deployer: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  blockNumber: bigint;
  blockTimestamp: Date;
  transactionHash: string;
}

export interface ListTokensOptions {
  chain?: ChainName;
  limit?: number;
  offset?: number;
}

export class TokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createToken(input: CreateTokenInput): Promise<Token> {
    return this.prisma.token.create({
      data: {
        chain: input.chain,
        contractAddress: input.contractAddress.toLowerCase(),
        deployer: input.deployer.toLowerCase(),
        name: input.name,
        symbol: input.symbol,
        decimals: input.decimals,
        totalSupply: input.totalSupply,
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

  async listTokens(options: ListTokensOptions = {}): Promise<Token[]> {
    const { chain, limit = 50, offset = 0 } = options;

    const where: Prisma.TokenWhereInput = chain ? { chain } : {};

    return this.prisma.token.findMany({
      where,
      orderBy: { discoveredAt: 'desc' },
      take: limit,
      skip: offset,
    });
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
