import { useState, useCallback, useEffect, useRef } from 'react';
import type { TokenData } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { Header } from './components/Header';
import { StatsSection } from './components/StatsSection';
import { TokenGrid } from './components/TokenGrid';
import { ChainPanel } from './components/ChainPanel';
import { ConnectionBanner } from './components/ConnectionBanner';
import { AnalyticsPage } from './components/AnalyticsPage';

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
  const [liveTokens, setLiveTokens] = useState<TokenData[]>([]);
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  const newTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigateToAnalytics = useCallback((chain: string, address: string) => {
    window.location.hash = `/analytics/${chain}/${address}`;
  }, []);

  const handleTokenDiscovery = useCallback((token: TokenData) => {
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
  }, []);

  useEffect(() => {
    return () => {
      newTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const { isConnected } = useWebSocket({ onTokenDiscovery: handleTokenDiscovery });

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
      <main className="main-content">
        <div className="main-left">
          <StatsSection />
          <TokenGrid liveTokens={liveTokens} newKeys={newKeys} onAnalytics={navigateToAnalytics} />
        </div>
        <aside className="main-right">
          <ChainPanel />
        </aside>
      </main>
    </div>
  );
}
