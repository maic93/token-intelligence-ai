export interface FormattedToken {
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

export interface SearchResponse {
  data: FormattedToken[];
  nextCursor: string | null;
  total: number;
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

export interface DeployerToken {
  contractAddress: string;
  chain: string;
  tokenName: string;
  tokenSymbol: string;
  blockNumber: string;
  blockTimestamp: string;
  riskScore: number | null;
  riskLevel: string | null;
}

export interface DeployerData {
  deployer: string;
  totalContracts: number;
  chains: string[];
  firstDeployment: string | null;
  latestDeployment: string | null;
  averageRisk: number | null;
  tokens: DeployerToken[];
}

export interface DeployerResponse {
  data: DeployerData;
}
