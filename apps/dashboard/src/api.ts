import type {
  RiskAnalysis,
  TokenListResponse,
  TokenSearchResponse,
  StatsResponse,
  ChainsResponse,
  AnalyticsResponse,
  PlatformAnalyticsResponse,
  DeployerListResponse,
  DeployerDetailResponse,
  B20ListResponse,
  IntelligenceListResponse,
  WalletListResponse,
  WalletDetailResponse,
  WalletSearchResponse,
  TrendsResponse,
  ChainHealthResponse,
  LeaderboardResponse,
} from './types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchTokens(
  params: {
    page?: number;
    limit?: number;
    chain?: string;
    q?: string;
    risk?: string;
    minScore?: number;
    maxScore?: number;
    deployer?: string;
    sort?: string;
    cursor?: string;
    from?: string;
    to?: string;
  },
  signal?: AbortSignal,
): Promise<TokenListResponse | TokenSearchResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.chain) search.set('chain', params.chain);
  if (params.q) search.set('q', params.q);
  if (params.risk) search.set('risk', params.risk);
  if (params.minScore !== undefined) search.set('minScore', String(params.minScore));
  if (params.maxScore !== undefined) search.set('maxScore', String(params.maxScore));
  if (params.deployer) search.set('deployer', params.deployer);
  if (params.sort) search.set('sort', params.sort);
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  return fetchJson<TokenListResponse | TokenSearchResponse>(
    `${API_BASE}/tokens?${search.toString()}`,
    signal,
  );
}

export function fetchToken(
  address: string,
  chain: string,
  signal?: AbortSignal,
): Promise<{ data: TokenListResponse['data'][0] }> {
  return fetchJson(`${API_BASE}/tokens/${address}?chain=${encodeURIComponent(chain)}`, signal);
}

export function fetchStats(signal?: AbortSignal): Promise<StatsResponse> {
  return fetchJson<StatsResponse>(`${API_BASE}/stats`, signal);
}

export function fetchChains(signal?: AbortSignal): Promise<ChainsResponse> {
  return fetchJson<ChainsResponse>(`${API_BASE}/chains`, signal);
}

export function fetchPlatformAnalytics(signal?: AbortSignal): Promise<PlatformAnalyticsResponse> {
  return fetchJson<PlatformAnalyticsResponse>(`${API_BASE}/platform-analytics`, signal);
}

export function fetchDeployers(signal?: AbortSignal): Promise<DeployerListResponse> {
  return fetchJson<DeployerListResponse>(`${API_BASE}/deployers`, signal);
}

export function fetchDeployer(
  address: string,
  chain?: string,
  signal?: AbortSignal,
): Promise<DeployerDetailResponse> {
  const search = chain ? `?chain=${encodeURIComponent(chain)}` : '';
  return fetchJson<DeployerDetailResponse>(
    `${API_BASE}/deployers/${encodeURIComponent(address)}${search}`,
    signal,
  );
}

export function fetchAnalytics(
  chain: string,
  address: string,
  signal?: AbortSignal,
): Promise<AnalyticsResponse> {
  return fetchJson<AnalyticsResponse>(
    `${API_BASE}/analytics/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`,
    signal,
  );
}

export function fetchAnalysis(
  chain: string,
  address: string,
  signal?: AbortSignal,
): Promise<{ data: RiskAnalysis }> {
  return fetchJson<{ data: RiskAnalysis }>(
    `${API_BASE}/analysis/${encodeURIComponent(address)}?chain=${encodeURIComponent(chain)}`,
    signal,
  );
}

export function fetchB20Tokens(
  params: {
    page?: number;
    limit?: number;
    minConfidence?: number;
    sort?: string;
    q?: string;
    risk?: string;
  },
  signal?: AbortSignal,
): Promise<B20ListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.minConfidence !== undefined) search.set('minConfidence', String(params.minConfidence));
  if (params.sort) search.set('sort', params.sort);
  return fetchJson<B20ListResponse>(`${API_BASE}/b20?${search.toString()}`, signal);
}

export function fetchIntelligence(
  params: {
    category?: string;
    recommendation?: string;
    chain?: string;
    limit?: number;
    offset?: number;
  },
  signal?: AbortSignal,
): Promise<IntelligenceListResponse> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.recommendation) search.set('recommendation', params.recommendation);
  if (params.chain) search.set('chain', params.chain);
  if (params.limit) search.set('limit', String(params.limit));
  if (params.offset) search.set('offset', String(params.offset));
  return fetchJson<IntelligenceListResponse>(
    `${API_BASE}/intelligence?${search.toString()}`,
    signal,
  );
}

export function fetchIntelligenceDetail(
  contractAddress: string,
  chain?: string,
  signal?: AbortSignal,
): Promise<{ data: IntelligenceListResponse['data'][0] }> {
  const search = chain ? `?chain=${encodeURIComponent(chain)}` : '';
  return fetchJson(
    `${API_BASE}/intelligence/${encodeURIComponent(contractAddress)}${search}`,
    signal,
  );
}

export function fetchWallets(
  params: {
    page?: number;
    limit?: number;
    grade?: string;
    label?: string;
    sort?: string;
    search?: string;
  },
  signal?: AbortSignal,
): Promise<WalletListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.grade) search.set('grade', params.grade);
  if (params.label) search.set('label', params.label);
  if (params.sort) search.set('sort', params.sort);
  if (params.search) search.set('search', params.search);
  return fetchJson<WalletListResponse>(`${API_BASE}/wallets?${search.toString()}`, signal);
}

export function fetchWallet(address: string, signal?: AbortSignal): Promise<WalletDetailResponse> {
  return fetchJson<WalletDetailResponse>(
    `${API_BASE}/wallets/${encodeURIComponent(address)}`,
    signal,
  );
}

export function searchWallets(q: string, signal?: AbortSignal): Promise<WalletSearchResponse> {
  return fetchJson<WalletSearchResponse>(
    `${API_BASE}/wallets/search?q=${encodeURIComponent(q)}`,
    signal,
  );
}

export function fetchTrends(signal?: AbortSignal): Promise<TrendsResponse> {
  return fetchJson<TrendsResponse>(`${API_BASE}/trends`, signal);
}

export function fetchChainHealth(signal?: AbortSignal): Promise<ChainHealthResponse> {
  return fetchJson<ChainHealthResponse>(`${API_BASE}/chains/status`, signal);
}

export function fetchLeaderboard(
  category: string,
  signal?: AbortSignal,
): Promise<LeaderboardResponse> {
  return fetchJson<LeaderboardResponse>(
    `${API_BASE}/leaderboards/${encodeURIComponent(category)}`,
    signal,
  );
}

export function fetchCrossChainAnalytics(signal?: AbortSignal): Promise<{ data: unknown }> {
  return fetchJson(`${API_BASE}/cross-chain-analytics`, signal);
}

export function createWebSocketUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/ws`;
}
