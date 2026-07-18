import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { TokenData, AlertMessage } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { useWatchlist } from './hooks/useWatchlist';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { HeroSection } from './components/HeroSection';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
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

  const navigateToView = useCallback((view: string) => {
    setActiveView(view);
    if (view === 'analytics') {
      window.location.hash = '#/analytics';
    } else {
      window.location.hash = '';
    }
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
      <div className="app-layout">
        <Sidebar
          activeView="analytics"
          onNavigate={navigateToView}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="main-area">
          <TopNav
            connected={isConnected}
            onMenuToggle={() => setSidebarOpen((p) => !p)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <main className="main-content">
            <AnalyticsPage
              chain={route.chain}
              address={route.address}
              onBack={() => {
                window.location.hash = '';
                setRoute({ view: 'main' });
              }}
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeView={activeView}
        onNavigate={navigateToView}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-area">
        <TopNav
          connected={isConnected}
          onMenuToggle={() => setSidebarOpen((p) => !p)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          unreadCount={unreadCount}
          onBellClick={() => markAllSeen()}
        />
        {!isConnected && <ConnectionBanner />}
        <AlertNotification alerts={alerts} />
        <main className="main-content">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <>
                <HeroSection />
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
              </>
            )}
            {activeView === 'tokens' && (
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
            )}
            {activeView === 'chains' && (
              <div className="main-with-sidebar">
                <div className="main-left">
                  <HeroSection />
                  <ChainPanel />
                </div>
                <aside className="main-right">
                  <WatchlistPanel
                    items={watchlist}
                    onRemove={removeFromWatchlist}
                    liveTokens={liveTokens}
                  />
                </aside>
              </div>
            )}
            {activeView === 'settings' && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </div>
                <div>Settings</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Coming soon
                </div>
              </div>
            )}
          </AnimatePresence>
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
    </div>
  );
}
