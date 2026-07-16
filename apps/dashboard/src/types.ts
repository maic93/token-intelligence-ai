export interface TokenData {
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
}

export interface RiskFactor {
  rule: string;
  passed: boolean;
  penalty: number;
  reason: string;
}

export interface RiskAnalysis {
  riskScore: number;
  riskLevel: string;
  explanation: string;
  factors: RiskFactor[];
  analyzedAt: string;
}

export interface TokenListResponse {
  data: TokenData[];
  pagination: {
    page: number;
    limit: number;
  };
}

export interface TokenSearchResponse {
  data: TokenData[];
  nextCursor: string | null;
  total: number;
}

export interface StatsData {
  totalTokens: number;
  recentTokens24h: number;
  uniqueDeployers: number;
  chains: Array<{ chain: string; count: number }>;
  cursors: Array<{ chain: string; blockNumber: string }>;
  updatedAt: string;
}

export interface StatsResponse {
  data: StatsData;
}

export interface ChainInfo {
  name: string;
  chainId: number;
  displayName: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  enabled: boolean;
  tokenCount: number;
  lastSyncedBlock: string | null;
  rpcAvailable: boolean;
}

export interface ChainsResponse {
  data: {
    chains: ChainInfo[];
    updatedAt: string;
  };
}

export interface WebSocketMessage {
  event: string;
  data: TokenData;
}

export type ChainName = 'base' | 'robinhood' | 'ethereum' | 'polygon';

export function isChainName(value: string): value is ChainName {
  return ['base', 'robinhood', 'ethereum', 'polygon'].includes(value);
}

export interface PlatformAnalyticsData {
  totalTokens: number;
  tokensToday: number;
  tokensThisWeek: number;
  tokensThisMonth: number;
  averageRiskScore: number | null;
  riskDistribution: Record<string, number>;
  tokensPerChain: Array<{ chain: string; count: number }>;
  topDeployers: Array<{ deployer: string; count: number }>;
  latestTokens: Array<{
    contractAddress: string;
    chain: string;
    tokenName: string;
    tokenSymbol: string;
    riskScore: number | null;
    riskLevel: string | null;
    discoveredAt: string;
  }>;
}

export interface PlatformAnalyticsResponse {
  data: PlatformAnalyticsData;
}

export interface DeployerData {
  deployer: string;
  totalContracts: number;
  chains: string[];
  firstDeployment: string | null;
  latestDeployment: string | null;
  averageRisk: number | null;
  tokens: Array<{
    contractAddress: string;
    chain: string;
    tokenName: string;
    tokenSymbol: string;
    blockNumber: string;
    blockTimestamp: string;
    riskScore: number | null;
    riskLevel: string | null;
  }>;
}

export interface DeployerResponse {
  data: DeployerData;
}

export interface AnalyticsReport {
  token: { contractAddress: string; chain: string };
  chain: string;
  tokenAnalytics: {
    tokenAge: number | null;
    chain: string;
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
  };
  liquidityAnalytics: {
    liquidity: number | null;
    liquidityRatio: number | null;
    estimatedMarketCap: number | null;
    fdv: number | null;
    lockedLiquidity: number | null;
    dexCount: number | null;
  };
  holderAnalytics: {
    topHolderPercentage: number | null;
    top5Holders: number | null;
    top10Holders: number | null;
    whaleConcentration: number | null;
    creatorBalance: string | null;
    burnAddressBalance: string | null;
    distributionScore: number | null;
    holderGrowth24h: number | null;
  };
  transactionAnalytics: {
    transactions24h: number | null;
    uniqueBuyers24h: number | null;
    uniqueSellers24h: number | null;
    buySellRatio: number | null;
    volume24h: number | null;
    averageTransactionSize: number | null;
    largestTransaction: number | null;
  };
  deployerAnalytics: {
    deployedContracts: number | null;
    previousTokens: string[] | null;
    knownDeployer: boolean | null;
    previousRugs: number | null;
    deploymentFrequency: number | null;
    walletAge: number | null;
  };
  chainAnalytics: {
    latestIndexedBlock: string | null;
    indexedTokens: number | null;
    rpcHealth: string;
    syncDelay: number | null;
    indexingSpeed: number | null;
  };
  generatedAt: string;
  version: string;
}

export interface AnalyticsResponse {
  data: AnalyticsReport;
}
