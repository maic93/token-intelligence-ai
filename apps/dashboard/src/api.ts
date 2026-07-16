import type { TokenListResponse, StatsResponse, ChainsResponse, AnalyticsResponse } from './types';

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
  },
  signal?: AbortSignal,
): Promise<TokenListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.chain) search.set('chain', params.chain);
  return fetchJson<TokenListResponse>(`${API_BASE}/tokens?${search.toString()}`, signal);
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

export function createWebSocketUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/ws`;
}
