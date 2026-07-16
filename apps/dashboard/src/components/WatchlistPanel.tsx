import { useMemo } from 'react';
import type { TokenData } from '../types';

interface WatchlistItem {
  addedAt: string;
  chain: string;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  riskScore: number | null;
  riskLevel: string | null;
}

interface Props {
  items: WatchlistItem[];
  onRemove: (chain: string, address: string) => void;
  liveTokens: TokenData[];
}

export function WatchlistPanel({ items, onRemove, liveTokens }: Props) {
  const liveMap = useMemo(() => {
    const map = new Map<string, TokenData>();
    for (const t of liveTokens) {
      map.set(`${t.chain}:${t.contractAddress}`, t);
    }
    return map;
  }, [liveTokens]);

  if (items.length === 0) {
    return (
      <div className="watchlist-panel">
        <h3 className="watchlist-title">Watchlist</h3>
        <p className="watchlist-empty">
          No watched tokens yet. Click the star icon on any token to add it.
        </p>
      </div>
    );
  }

  return (
    <div className="watchlist-panel">
      <h3 className="watchlist-title">Watchlist ({items.length})</h3>
      <div className="watchlist-items">
        {items.map((item) => {
          const key = `${item.chain}:${item.contractAddress}`;
          const live = liveMap.get(key);
          const riskScore = live?.riskScore ?? item.riskScore;
          const riskLevel = live?.riskLevel ?? item.riskLevel;
          return (
            <div key={key} className="watchlist-item">
              <div className="watchlist-item-info">
                <span className="watchlist-item-name">{item.tokenName}</span>
                <span className="watchlist-item-symbol">{item.tokenSymbol}</span>
                <span className="watchlist-item-chain">{item.chain}</span>
                {riskScore !== null && (
                  <span className={`watchlist-item-risk risk-level--${riskLevel ?? 'unknown'}`}>
                    {riskScore}
                  </span>
                )}
              </div>
              <button
                className="watchlist-item-remove"
                onClick={() => onRemove(item.chain, item.contractAddress)}
                title="Remove from watchlist"
                type="button"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
