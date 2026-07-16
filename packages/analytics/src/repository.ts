import { TokenRepository, prisma } from '@token-intelligence-ai/database';
import type { ChainName } from '@token-intelligence-ai/blockchain';

const tokenRepo = new TokenRepository(prisma);

export interface TokenAnalyticsRow {
  chain: string;
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
}

export interface DeployerContractsRow {
  contractAddress: string;
  chain: string;
  blockTimestamp: Date;
}

export interface ChainCursorRow {
  chain: string;
  blockNumber: bigint;
}

export const analyticsRepository = {
  async getToken(chain: ChainName, address: string): Promise<TokenAnalyticsRow | null> {
    const token = await tokenRepo.getTokenByAddress(chain, address.toLowerCase());
    if (!token) return null;
    return {
      chain: token.chain,
      chainId: token.chainId,
      contractAddress: token.contractAddress,
      deployer: token.deployer,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      totalSupply: token.totalSupply,
      blockNumber: token.blockNumber,
      blockTimestamp: token.blockTimestamp,
      transactionHash: token.transactionHash,
    };
  },

  async getDeployerContracts(
    deployer: string,
    excludeAddress: string,
  ): Promise<DeployerContractsRow[]> {
    const tokens = await prisma.token.findMany({
      where: {
        deployer: deployer.toLowerCase(),
        contractAddress: { not: excludeAddress.toLowerCase() },
      },
      select: { contractAddress: true, chain: true, blockTimestamp: true },
      orderBy: { blockTimestamp: 'desc' },
    });
    return tokens;
  },

  async getTokenCount(): Promise<number> {
    return prisma.token.count();
  },

  async getCursor(chain: ChainName): Promise<ChainCursorRow | null> {
    const cursor = await tokenRepo.getLastProcessedBlock(chain);
    if (cursor === null) return null;
    return { chain, blockNumber: cursor };
  },

  async getChainTokenCount(chain: ChainName): Promise<number> {
    return prisma.token.count({ where: { chain } });
  },
};
