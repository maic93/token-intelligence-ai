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
}

export interface TokenListResponse {
  data: TokenData[];
  pagination: {
    page: number;
    limit: number;
  };
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
