export type WatchEventType =
  'NEW_TOKEN' | 'RISK_CHANGED' | 'HIGH_RISK' | 'TOKEN_UPDATED' | 'SYSTEM';

export interface WatchItem {
  id: string;
  chain: string;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  addedAt: string;
  riskScore: number | null;
  riskLevel: string | null;
}

export interface WatchEvent {
  id: string;
  tokenId: string;
  eventType: WatchEventType;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  token?: {
    chain: string;
    contractAddress: string;
    name: string;
    symbol: string;
  };
}

export interface AlertMessage {
  type: 'WATCH_EVENT';
  event: WatchEvent;
}

export interface WatchEventsResponse {
  data: WatchEvent[];
  nextCursor: string | null;
  total: number;
}
