import { useState, useEffect, useCallback, useRef } from 'react';
import type { Token } from './api.js';
import { fetchTokens } from './api.js';
import { connectWebSocket } from './ws.js';
import { TokenCard } from './components/TokenCard.js';
import { NewTokenBanner } from './components/NewTokenBanner.js';
import { StatsSection } from './components/StatsSection.js';

const CHAINS = ['base', 'robinhood', 'ethereum', 'polygon'] as const;

export function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<Token | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const loadTokens = useCallback(
    async (pageNum: number, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTokens(pageNum, 50, selectedChain || undefined);
        setTokens((prev) => (append ? [...prev, ...data.data] : data.data));
        setHasMore(data.data.length === 50);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tokens');
      } finally {
        setLoading(false);
      }
    },
    [selectedChain],
  );

  useEffect(() => {
    setPage(1);
    loadTokens(1);
  }, [loadTokens]);

  useEffect(() => {
    wsRef.current = connectWebSocket((data) => {
      const token = data as Token;
      setNewToken(token);
      setTokens((prev) => [token, ...prev]);
      setTimeout(() => setNewToken(null), 5000);
    });
    return () => wsRef.current?.close();
  }, []);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadTokens(next, true);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Token Intelligence AI</h1>
        <p style={styles.subtitle}>Real-time blockchain token discovery</p>
      </header>

      {newToken && <NewTokenBanner token={newToken} />}

      <StatsSection />

      <div style={styles.controls}>
        <select
          style={styles.select}
          value={selectedChain}
          onChange={(e) => setSelectedChain(e.target.value)}
        >
          <option value="">All Chains</option>
          {CHAINS.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <span style={styles.count}>{tokens.length} tokens</span>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        {tokens.map((t) => (
          <TokenCard key={`${t.chain}-${t.contractAddress}`} token={t} />
        ))}
      </div>

      {loading && <div style={styles.loading}>Loading...</div>}

      {hasMore && !loading && (
        <button style={styles.loadMore} onClick={handleLoadMore}>
          Load More
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#0f1117',
    minHeight: '100vh',
    color: '#e1e4e8',
  },
  header: {
    textAlign: 'center',
    padding: '40px 0',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#8b949e',
    marginTop: 8,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  select: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #30363d',
    backgroundColor: '#161b22',
    color: '#e1e4e8',
    fontSize: 14,
    cursor: 'pointer',
  },
  count: {
    fontSize: 14,
    color: '#8b949e',
  },
  error: {
    color: '#f85149',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(248,81,73,0.1)',
    marginBottom: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 16,
  },
  loading: {
    textAlign: 'center',
    padding: 40,
    color: '#8b949e',
  },
  loadMore: {
    display: 'block',
    margin: '24px auto',
    padding: '12px 32px',
    borderRadius: 8,
    border: '1px solid #30363d',
    backgroundColor: '#21262d',
    color: '#e1e4e8',
    fontSize: 14,
    cursor: 'pointer',
  },
};
