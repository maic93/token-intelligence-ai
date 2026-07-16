import { memo } from 'react';

interface Props {
  chain: string;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  riskScore: number | null;
  riskLevel: string | null;
  isWatched: boolean;
  onToggle: () => void;
}

export const WatchButton = memo(function WatchButton({ isWatched, onToggle }: Props) {
  return (
    <button
      className={`watch-btn ${isWatched ? 'watch-btn--active' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
      type="button"
    >
      {isWatched ? '\u2605' : '\u2606'}
    </button>
  );
});
