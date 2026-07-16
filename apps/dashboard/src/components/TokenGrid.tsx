import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTokens } from '../hooks/useTokens';
import { TokenCard } from './TokenCard';
import { LoadingSkeleton } from './LoadingSkeleton';

interface FilterOption {
  label: string;
  value: string;
}

const chainOptions: FilterOption[] = [
  { label: 'All Chains', value: '' },
  { label: 'Base', value: 'base' },
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Robinhood', value: 'robinhood' },
];

const riskOptions: FilterOption[] = [
  { label: 'All Risk', value: '' },
  { label: 'Safe', value: 'SAFE' },
  { label: 'Low Risk', value: 'LOW' },
  { label: 'Medium Risk', value: 'MEDIUM' },
  { label: 'High Risk', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const sortOptions: FilterOption[] = [
  { label: 'Newest', value: '' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Highest Risk', value: 'highest_risk' },
  { label: 'Lowest Risk', value: 'lowest_risk' },
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
];

function PillSelect({
  options,
  value,
  onChange,
}: {
  options: FilterOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select className="filter-pill" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

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

  const hasActiveFilters = useMemo(() => Object.values(filters).some((v) => v !== ''), [filters]);

  return (
    <section className="token-grid-section">
      <div className="section-header">
        <h2 className="section-title">Tokens</h2>
        {hasActiveFilters && (
          <button className="section-action" onClick={clearFilters} type="button">
            Clear filters
          </button>
        )}
      </div>

      <div className="token-grid-controls">
        <PillSelect
          options={chainOptions}
          value={filters.chain}
          onChange={(v) => updateFilter('chain', v)}
        />
        <PillSelect
          options={riskOptions}
          value={filters.risk}
          onChange={(v) => updateFilter('risk', v)}
        />
        <PillSelect
          options={sortOptions}
          value={filters.sort}
          onChange={(v) => updateFilter('sort', v)}
        />
      </div>

      {total > 0 && (
        <div className="token-grid-info">
          {total} token{total !== 1 ? 's' : ''} found
        </div>
      )}

      {error && (
        <div className="error-card">
          <div className="error-card-title">Failed to load tokens</div>
          <div className="error-card-message">{error}</div>
          <button className="btn btn-primary" onClick={loadMore} type="button">
            Retry
          </button>
        </div>
      )}

      {loading && tokens.length === 0 ? (
        <LoadingSkeleton count={6} />
      ) : tokens.length === 0 ? (
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
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          {filters.q ? 'No tokens match your search' : 'No tokens found'}
        </div>
      ) : (
        <>
          <motion.div className="token-grid" layout>
            {tokens.map((t, i) => (
              <TokenCard
                key={`${t.chain}-${t.contractAddress}`}
                token={t}
                isNew={newKeys.has(`${t.chain}:${t.contractAddress}`)}
                onAnalytics={onAnalytics}
                isWatched={isWatched?.(t.chain, t.contractAddress) ?? false}
                onToggleWatch={() => onToggleWatch?.(t.chain, t.contractAddress)}
                index={i}
              />
            ))}
          </motion.div>
          {hasMore && (
            <motion.button
              className="btn btn-load-more"
              onClick={loadMore}
              type="button"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? 'Loading...' : 'Load More'}
            </motion.button>
          )}
        </>
      )}
    </section>
  );
}
