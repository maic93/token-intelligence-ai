export interface Token {
  contractAddress: string;
  chain: string;
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
  data: Token[];
  pagination: {
    page: number;
    limit: number;
  };
}

export async function fetchTokens(
  page = 1,
  limit = 50,
  chain?: string,
): Promise<TokenListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (chain) params.set('chain', chain);
  const res = await fetch(`/api/tokens?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchToken(address: string, chain: string): Promise<Token | null> {
  const res = await fetch(`/api/tokens/${address}?chain=${chain}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

export interface PlatformStats {
  totalTokens: number;
  recentTokens24h: number;
  uniqueDeployers: number;
  chains: Array<{ chain: string; count: number }>;
  cursors: Array<{ chain: string; blockNumber: string }>;
  updatedAt: string;
}

export async function fetchStats(): Promise<PlatformStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}
