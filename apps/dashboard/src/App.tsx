import { useState, useCallback, useEffect, useRef } from 'react';
import type { TokenData, AlertMessage } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { useWatchlist } from './hooks/useWatchlist';
import { Header } from './components/Header';
import { StatsSection } from './components/StatsSection';
import { AnalyticsCards } from './components/AnalyticsCards';
import { ChartsSection } from './components/ChartsSection';
import { TokenGrid } from './components/TokenGrid';
import { ChainPanel } from './components/ChainPanel';
import { ConnectionBanner } from './components/ConnectionBanner';
import { AnalyticsPage } from './components/AnalyticsPage';
import { WatchlistPanel } from './components/WatchlistPanel';
import { AlertNotification } from './components/AlertNotification';
import { AlertBell } from './components/AlertBell';

const NEW_TOKEN_TTL = 10_000;

function parseHash(): { view: 'main' } | { view: 'analytics'; chain: string; address: string } {
  const hash = window.location.hash.slice(1);
  const match = hash.match(/^\/analytics\/([^/]+)\/(0x[a-fA-F0-9]{40})$/);
  if (match) {
    return { view: 'analytics', chain: match[1], address: match[2] };
  }
  return { view: 'main' };
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  const [liveTokens, setLiveTokens] = useState<TokenData[]>([]);
  const newTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const {
    watchlist,
    alerts,
    unreadCount,
    isWatched,
    addToWatchlist,
    removeFromWatchlist,
    addAlert,
    markAllSeen,
    clearAlerts,
  } = useWatchlist();

  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigateToAnalytics = useCallback((chain: string, address: string) => {
    window.location.hash = `/analytics/${chain}/${address}`;
  }, []);

  const handleTokenDiscovery = useCallback(
    (token: TokenData) => {
      const key = `${token.chain}:${token.contractAddress}`;
      setLiveTokens((prev) => [token, ...prev].slice(0, 100));
      setNewKeys((prev) => new Set(prev).add(key));
      const existing = newTimersRef.current.get(key);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        setNewKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        newTimersRef.current.delete(key);
      }, NEW_TOKEN_TTL);
      newTimersRef.current.set(key, timer);

      if (isWatched(token.chain, token.contractAddress)) {
        addAlert({
          id: `live-${key}-${Date.now()}`,
          message: `${token.tokenName} (${token.tokenSymbol}) just appeared on chain`,
          eventType: 'WATCH_EVENT',
          tokenName: token.tokenName,
          tokenSymbol: token.tokenSymbol,
          chain: token.chain,
          riskScore: token.riskScore ?? undefined,
          riskLevel: token.riskLevel ?? undefined,
          createdAt: new Date().toISOString(),
          seen: false,
        });
      }
    },
    [isWatched, addAlert],
  );

  const handleAlert = useCallback(
    (msg: AlertMessage) => {
      const e = msg.event;
      addAlert({
        id: `ws-${e.id}`,
        message: e.message,
        eventType: e.eventType,
        tokenName: e.token?.name ?? 'Unknown',
        tokenSymbol: e.token?.symbol ?? '',
        chain: e.token?.chain ?? '',
        riskScore: (e.metadata?.riskScore as number) ?? undefined,
        riskLevel: (e.metadata?.riskLevel as string) ?? undefined,
        createdAt: e.createdAt,
        seen: false,
      });
    },
    [addAlert],
  );

  useEffect(() => {
    return () => {
      newTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const { isConnected } = useWebSocket({
    onTokenDiscovery: handleTokenDiscovery,
    onAlert: handleAlert,
  });

  if (route.view === 'analytics') {
    return (
      <div className="app">
        <Header connected={isConnected()} />
        <AnalyticsPage
          chain={route.chain}
          address={route.address}
          onBack={() => {
            window.location.hash = '';
          }}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Header connected={isConnected()} />
      {!isConnected() && <ConnectionBanner />}
      <AlertNotification alerts={alerts} />
      <main className="main-content">
        <div className="main-left">
          <AnalyticsCards />
          <ChartsSection />
          <StatsSection />
          <TokenGrid
            newKeys={newKeys}
            onAnalytics={navigateToAnalytics}
            isWatched={isWatched}
            onToggleWatch={(chain, address) => {
              if (isWatched(chain, address)) {
                removeFromWatchlist(chain, address);
              } else {
                const token = liveTokens.find(
                  (t) => t.chain === chain && t.contractAddress === address,
                );
                if (token) {
                  addToWatchlist({
                    id: `${chain}:${address}`,
                    chain: token.chain,
                    contractAddress: token.contractAddress,
                    tokenName: token.tokenName,
                    tokenSymbol: token.tokenSymbol,
                    riskScore: token.riskScore,
                    riskLevel: token.riskLevel,
                  });
                }
              }
            }}
          />
        </div>
        <aside className="main-right">
          <ChainPanel />
          <WatchlistPanel
            items={watchlist}
            onRemove={removeFromWatchlist}
            liveTokens={liveTokens}
          />
        </aside>
      </main>
      <div className="header-controls">
        <AlertBell
          unreadCount={unreadCount}
          alerts={alerts}
          onMarkAllSeen={markAllSeen}
          onClearAll={clearAlerts}
        />
      </div>
    </div>
  );
}
