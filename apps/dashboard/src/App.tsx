import { useState, useCallback, useEffect, useRef } from 'react';
import type { TokenData } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { Header } from './components/Header';
import { StatsSection } from './components/StatsSection';
import { TokenGrid } from './components/TokenGrid';
import { ChainPanel } from './components/ChainPanel';
import { ConnectionBanner } from './components/ConnectionBanner';

const NEW_TOKEN_TTL = 10_000;

export default function App() {
  const [liveTokens, setLiveTokens] = useState<TokenData[]>([]);
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  const newTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

  return (
    <div className="app">
      <Header connected={isConnected()} />
      {!isConnected() && <ConnectionBanner />}
      <main className="main-content">
        <div className="main-left">
          <StatsSection />
          <TokenGrid liveTokens={liveTokens} newKeys={newKeys} />
        </div>
        <aside className="main-right">
          <ChainPanel />
        </aside>
      </main>
    </div>
  );
}
