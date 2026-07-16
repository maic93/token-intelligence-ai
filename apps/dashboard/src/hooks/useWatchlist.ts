import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'token-watchlist';
const MAX_ALERTS = 100;

export interface WatchlistItem {
  id: string;
  chain: string;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  addedAt: string;
  riskScore: number | null;
  riskLevel: string | null;
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

function loadWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(items: WatchlistItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(loadWatchlist);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    saveWatchlist(watchlist);
  }, [watchlist]);

  const isWatched = useCallback(
    (chain: string, contractAddress: string) =>
      watchlist.some((w) => w.chain === chain && w.contractAddress === contractAddress),
    [watchlist],
  );

  const addToWatchlist = useCallback((item: Omit<WatchlistItem, 'addedAt'>) => {
    const key = `${item.chain}:${item.contractAddress}`;
    setWatchlist((prev) => {
      if (prev.some((w) => `${w.chain}:${w.contractAddress}` === key)) return prev;
      return [...prev, { ...item, addedAt: new Date().toISOString() }];
    });
    addAlert({
      id: `watch-${Date.now()}`,
      message: `Added ${item.tokenName} (${item.tokenSymbol}) to watchlist`,
      eventType: 'WATCH_ADDED',
      tokenName: item.tokenName,
      tokenSymbol: item.tokenSymbol,
      chain: item.chain,
      riskScore: item.riskScore ?? undefined,
      riskLevel: item.riskLevel ?? undefined,
      createdAt: new Date().toISOString(),
      seen: false,
    });
  }, []);

  const removeFromWatchlist = useCallback((chain: string, contractAddress: string) => {
    setWatchlist((prev) =>
      prev.filter((w) => !(w.chain === chain && w.contractAddress === contractAddress)),
    );
  }, []);

  const addAlert = useCallback((alert: AlertItem) => {
    setAlerts((prev) => {
      if (seenIdsRef.current.has(alert.id)) return prev;
      seenIdsRef.current.add(alert.id);
      const next = [alert, ...prev].slice(0, MAX_ALERTS);
      return next;
    });
    setUnreadCount((prev) => prev + 1);
  }, []);

  const markAllSeen = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, seen: true })));
    setUnreadCount(0);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setUnreadCount(0);
    seenIdsRef.current.clear();
  }, []);

  return {
    watchlist,
    alerts,
    unreadCount,
    isWatched,
    addToWatchlist,
    removeFromWatchlist,
    addAlert,
    markAllSeen,
    clearAlerts,
  };
}
