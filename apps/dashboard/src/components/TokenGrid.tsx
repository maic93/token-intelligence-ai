import { useCallback } from 'react';
import { useTokens } from '../hooks/useTokens';
import { TokenCard } from './TokenCard';
import { LoadingSkeleton } from './LoadingSkeleton';

export function TokenGrid({
  newKeys,
  onAnalytics,
  isWatched,
  onToggleWatch,
}: {
  newKeys: Set<string>;
  onAnalytics?: (chain: string, address: string) => void;
  isWatched?: (chain: string, address: string) => boolean;
  onToggleWatch?: (chain: string, address: string) => void;
}) {
  const { tokens, loading, error, total, hasMore, filters, updateFilter, loadMore, clearFilters } =
    useTokens();

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const key = e.target.dataset.filter as 'q' | 'chain' | 'risk' | 'sort' | 'deployer';
      if (key) updateFilter(key, e.target.value);
    },
    [updateFilter],
  );

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <section className="token-grid-section">
      <div className="token-grid-controls">
        <input
          className="search-input"
          type="text"
          placeholder="Search by name, symbol, address, deployer..."
          value={filters.q}
          data-filter="q"
          onChange={handleInputChange}
        />
        <select
          className="chain-select"
          value={filters.chain}
          data-filter="chain"
          onChange={handleInputChange}
        >
          <option value="">All Chains</option>
          <option value="base">Base</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="robinhood">Robinhood</option>
        </select>
        <select
          className="chain-select"
          value={filters.risk}
          data-filter="risk"
          onChange={handleInputChange}
        >
          <option value="">All Risk</option>
          <option value="very_safe">Very Safe</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
          <option value="critical">Critical</option>
        </select>
        <select
          className="chain-select"
          value={filters.sort}
          data-filter="sort"
          onChange={handleInputChange}
        >
          <option value="">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest_risk">Highest Risk</option>
          <option value="lowest_risk">Lowest Risk</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
        </select>
        {hasActiveFilters && (
          <button className="btn btn-sm" onClick={clearFilters} type="button">
            Clear
          </button>
        )}
      </div>

      {total > 0 && (
        <div className="token-grid-info">
          {total} token{total !== 1 ? 's' : ''} found
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {loading && tokens.length === 0 ? (
        <LoadingSkeleton count={6} />
      ) : tokens.length === 0 ? (
        <div className="empty-state">
          {filters.q ? 'No tokens match your search' : 'No tokens found'}
        </div>
      ) : (
        <>
          <div className="token-grid">
            {tokens.map((t) => (
              <TokenCard
                key={`${t.chain}:${t.contractAddress}`}
                token={t}
                isNew={newKeys.has(`${t.chain}:${t.contractAddress}`)}
                onAnalytics={onAnalytics}
                isWatched={isWatched?.(t.chain, t.contractAddress) ?? false}
                onToggleWatch={() => onToggleWatch?.(t.chain, t.contractAddress)}
              />
            ))}
          </div>
          {hasMore && (
            <button
              className="btn btn-load-more"
              onClick={loadMore}
              type="button"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
