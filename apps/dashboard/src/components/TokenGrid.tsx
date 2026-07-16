import { useState, useMemo } from 'react';
import type { TokenData } from '../types';
import { useTokens } from '../hooks/useTokens';
import { TokenCard } from './TokenCard';
import { LoadingSkeleton } from './LoadingSkeleton';

const PAGE_SIZE = 12;

export function TokenGrid({
  liveTokens,
  newKeys,
  onAnalytics,
}: {
  liveTokens: TokenData[];
  newKeys: Set<string>;
  onAnalytics?: (chain: string, address: string) => void;
}) {
  const {
    loading,
    error,
    search,
    setSearch,
    chain,
    setChain,
    filteredTokens,
    hasMore,
    page,
    setPage,
  } = useTokens();

  const [clientPage, setClientPage] = useState(0);

  const merged = useMemo(() => {
    const seen = new Set<string>();
    const list: TokenData[] = [];
    for (const t of [...liveTokens, ...filteredTokens]) {
      const key = `${t.chain}:${t.contractAddress}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(t);
      }
    }
    return list;
  }, [liveTokens, filteredTokens]);

  const paginated = merged.slice(0, (clientPage + 1) * PAGE_SIZE);

  function handleSearch(val: string) {
    setSearch(val);
    setClientPage(0);
  }

  function handleChain(val: string) {
    setChain(val || undefined);
    setClientPage(0);
  }

  function handleLoadMore() {
    if (clientPage * PAGE_SIZE + PAGE_SIZE >= filteredTokens.length && hasMore) {
      setPage(page + 1);
    }
    setClientPage((p) => p + 1);
  }

  return (
    <section className="token-grid-section">
      <div className="token-grid-controls">
        <input
          className="search-input"
          type="text"
          placeholder="Search by name, symbol, or address..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          className="chain-select"
          value={chain ?? ''}
          onChange={(e) => handleChain(e.target.value)}
        >
          <option value="">All Chains</option>
          <option value="base">Base</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="robinhood">Robinhood</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && merged.length === 0 ? (
        <LoadingSkeleton count={6} />
      ) : paginated.length === 0 ? (
        <div className="empty-state">No tokens found</div>
      ) : (
        <>
          <div className="token-grid">
            {paginated.map((t) => (
              <TokenCard
                key={`${t.chain}:${t.contractAddress}`}
                token={t}
                isNew={newKeys.has(`${t.chain}:${t.contractAddress}`)}
                onAnalytics={onAnalytics}
              />
            ))}
          </div>
          {paginated.length < merged.length && (
            <button className="btn btn-load-more" onClick={handleLoadMore} type="button">
              Load More
            </button>
          )}
        </>
      )}
    </section>
  );
}
