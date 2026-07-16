import type { ChainName } from '@token-intelligence-ai/blockchain';

export interface TokenAnalytics {
  tokenAge: number | null;
  chain: ChainName;
  chainId: number;
  creationBlock: string | null;
  creationTimestamp: string | null;
  creatorAddress: string | null;
  holderCount: number | null;
  totalSupply: string | null;
  decimals: number | null;
  verifiedSource: boolean | null;
  contractType: string | null;
  isProxy: boolean | null;
  isMintable: boolean | null;
  isPausable: boolean | null;
  ownershipRenounced: boolean | null;
}

export interface LiquidityAnalytics {
  liquidity: number | null;
  liquidityRatio: number | null;
  estimatedMarketCap: number | null;
  fdv: number | null;
  lockedLiquidity: number | null;
  dexCount: number | null;
}

export interface HolderAnalytics {
  topHolderPercentage: number | null;
  top5Holders: number | null;
  top10Holders: number | null;
  whaleConcentration: number | null;
  creatorBalance: string | null;
  burnAddressBalance: string | null;
  distributionScore: number | null;
  holderGrowth24h: number | null;
}

export interface TransactionAnalytics {
  transactions24h: number | null;
  uniqueBuyers24h: number | null;
  uniqueSellers24h: number | null;
  buySellRatio: number | null;
  volume24h: number | null;
  averageTransactionSize: number | null;
  largestTransaction: number | null;
}

export interface DeployerAnalytics {
  deployedContracts: number | null;
  previousTokens: string[] | null;
  knownDeployer: boolean | null;
  previousRugs: number | null;
  deploymentFrequency: number | null;
  walletAge: number | null;
}

export interface ChainAnalytics {
  latestIndexedBlock: string | null;
  indexedTokens: number | null;
  rpcHealth: 'healthy' | 'degraded' | 'unknown';
  syncDelay: number | null;
  indexingSpeed: number | null;
}

export interface AnalyticsReport {
  token: {
    contractAddress: string;
    chain: ChainName;
  };
  chain: ChainName;
  tokenAnalytics: TokenAnalytics;
  holderAnalytics: HolderAnalytics;
  liquidityAnalytics: LiquidityAnalytics;
  transactionAnalytics: TransactionAnalytics;
  deployerAnalytics: DeployerAnalytics;
  chainAnalytics: ChainAnalytics;
  generatedAt: string;
  version: string;
}
