export interface TokenData {
  contractAddress: string;
  chain: string;
  chainId: number;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  totalSupply: string;
  metadataConfidence: number;
  deployer: string;
  deployerReputation?: number;
  deployerGrade?: string;
  aiCategory?: string;
  aiRecommendation?: string;
  aiConfidence?: number;
  aiSummary?: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  riskScore: number | null;
  riskLevel: string | null;
  ownerRenounced?: boolean;
  mintable?: boolean;
  pausable?: boolean;
  blacklistFunction?: boolean;
  proxyContract?: boolean;
  verifiedSource?: boolean;
  buyTax?: number;
  sellTax?: number;
  liquidityLocked?: boolean;
  liquidityPercent?: number;
  holderCount?: number;
  top10HolderPercent?: number;
  top1HolderPercent?: number;
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
  ownerRenounced?: boolean;
  mintable?: boolean;
  pausable?: boolean;
  blacklistFunction?: boolean;
  proxyContract?: boolean;
  verifiedSource?: boolean;
  buyTax?: number;
  sellTax?: number;
  liquidityLocked?: boolean;
  liquidityPercent?: number;
  holderCount?: number;
  top10HolderPercent?: number;
  top1HolderPercent?: number;
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

export interface AlertWebSocketMessage {
  type: 'WATCH_EVENT';
  event: WatchEvent;
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

export interface WatchEvent {
  id: string;
  tokenId: string;
  eventType: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  token: {
    chain: string;
    contractAddress: string;
    name: string;
    symbol: string;
  } | null;
}

export interface AlertMessage {
  type: 'WATCH_EVENT';
  event: WatchEvent;
}

export interface B20TokenData extends TokenData {
  isB20: boolean;
  b20Confidence: number;
}

export interface B20AnalyticsData {
  totalB20Tokens: number;
  averageConfidence: number;
  highestConfidence: number;
  newestB20: B20TokenData | null;
  detectedToday: number;
  detectedHour: number;
  topCreator: { deployer: string; count: number } | null;
  highestRisk: B20TokenData | null;
}

export interface B20ListResponse {
  data: B20TokenData[];
  analytics: B20AnalyticsData;
  pagination: { page: number; limit: number };
}

export interface DeployerSummaryItem {
  wallet: string;
  tokensCreated: number;
  reputationScore: number;
  reputationGrade: string;
  avgRiskScore: number | null;
  avgMetadataConfidence: number;
  avgB20Confidence: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

export interface DeployerOverview {
  averageCreatorReputation: number;
  worstCreator: { wallet: string; score: number } | null;
  bestCreator: { wallet: string; score: number } | null;
  repeatDeployers: number;
  totalDeployers: number;
}

export interface DeployerListResponse {
  top: DeployerSummaryItem[];
  worst: DeployerSummaryItem[];
  overview: DeployerOverview;
}

export interface DeployerTokenDetail {
  contractAddress: string;
  chain: string;
  tokenName: string;
  tokenSymbol: string;
  blockNumber: string;
  blockTimestamp: string;
  riskScore: number | null;
  riskLevel: string | null;
  b20Confidence: number;
  isB20: boolean;
}

export interface DeployerDetailData {
  deployer: string;
  reputation: {
    score: number;
    grade: string;
    reasons: string[];
  };
  totalContracts: number;
  chains: string[];
  firstDeployment: string | null;
  latestDeployment: string | null;
  averageRisk: number | null;
  b20Tokens: number;
  analytics: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    avgRiskScore: number | null;
    avgMetadataConfidence: number;
    avgB20Confidence: number;
    uniqueSymbols: number;
    firstSeen: string | null;
    lastSeen: string | null;
  };
  tokens: DeployerTokenDetail[];
}

export interface DeployerDetailResponse {
  data: DeployerDetailData;
}

export interface IntelligenceTokenData {
  id: number;
  contractAddress: string;
  chain: string;
  name: string;
  symbol: string;
  aiCategory: string;
  aiRecommendation: string;
  aiConfidence: number;
  aiSummary: string;
  deployerReputation: number;
  deployerGrade: string;
  discoveredAt: string;
}

export interface IntelligenceListResponse {
  data: IntelligenceTokenData[];
  pagination: { total: number; limit: number; offset: number };
  aggregations: {
    categories: Record<string, number>;
    recommendations: Record<string, number>;
  };
}

export interface AlertItem {
  id: string;
  message: string;
  eventType: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  riskScore?: number;
  riskLevel?: string;
  createdAt: string;
  seen: boolean;
}
