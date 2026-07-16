import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, Check } from 'lucide-react';
import type { TokenData } from '../types';
import { explorerUrl, shortAddress, timeAgo } from '../utils';
import { WatchButton } from './WatchButton';
import { RiskDetailsModal } from './RiskDetailsModal';

interface TokenCardProps {
  token: TokenData;
  isNew?: boolean;
  onAnalytics?: (chain: string, address: string) => void;
  isWatched?: boolean;
  onToggleWatch?: () => void;
  index?: number;
}

function scoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'var(--text-muted)';
  if (score <= 20) return '#4ade80';
  if (score <= 40) return '#a3e635';
  if (score <= 60) return '#facc15';
  if (score <= 80) return '#fb923c';
  return '#f87171';
}

function chainBadgeClass(chain: string): string {
  return `chain-badge-${chain}`;
}

export function TokenCard({
  token,
  isNew,
  onAnalytics,
  isWatched,
  onToggleWatch,
  index = 0,
}: TokenCardProps) {
  const [copied, setCopied] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(token.contractAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const initial = token.tokenSymbol ? token.tokenSymbol[0].toUpperCase() : '?';

  return (
    <motion.div
      className={`token-card ${isNew ? 'token-card-new' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      layout
    >
      {isNew && <span className="new-badge">NEW</span>}

      <div className="token-card-header">
        <div className="token-logo-placeholder">{initial}</div>
        <span className="token-symbol">{token.tokenSymbol}</span>
        <span className={`chain-badge ${chainBadgeClass(token.chain)}`}>{token.chain}</span>
        {token.riskScore !== null && token.riskScore !== undefined && (
          <span className="risk-score-badge" style={{ color: scoreColor(token.riskScore) }}>
            {token.riskScore}
          </span>
        )}
      </div>

      <div className="token-name">{token.tokenName || 'Unnamed'}</div>

      <div className="token-address-row">
        <span className="token-address-text">{shortAddress(token.contractAddress)}</span>
        <button
          className="token-address-copy"
          onClick={handleCopy}
          title="Copy address"
          aria-label="Copy address"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>

      <div className="token-details-grid">
        <div className="token-detail-item">
          <span className="token-detail-label">Supply</span>
          <span className="token-detail-value">{shortAddress(token.totalSupply)}</span>
        </div>
        <div className="token-detail-item">
          <span className="token-detail-label">Decimals</span>
          <span className="token-detail-value">{token.decimals}</span>
        </div>
        <div className="token-detail-item">
          <span className="token-detail-label">Discovered</span>
          <span className="token-detail-value">{timeAgo(token.blockTimestamp)}</span>
        </div>
        <div className="token-detail-item">
          <span className="token-detail-label">Deployer</span>
          <span className="token-detail-value">{shortAddress(token.deployer)}</span>
        </div>
      </div>

      <div className="token-card-actions">
        <WatchButton
          chain={token.chain}
          contractAddress={token.contractAddress}
          tokenName={token.tokenName}
          tokenSymbol={token.tokenSymbol}
          riskScore={token.riskScore}
          riskLevel={token.riskLevel}
          isWatched={isWatched ?? false}
          onToggle={onToggleWatch ?? (() => {})}
        />
        <a
          className="btn"
          href={explorerUrl(token.chain, token.contractAddress)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={12} /> Explorer
        </a>
        {onAnalytics && (
          <button
            className="btn"
            onClick={() => onAnalytics(token.chain, token.contractAddress)}
            type="button"
          >
            Analytics
          </button>
        )}
        {token.riskLevel && (
          <button className="btn btn-primary" onClick={() => setShowRiskModal(true)} type="button">
            Risk
          </button>
        )}
      </div>

      {showRiskModal && <RiskDetailsModal token={token} onClose={() => setShowRiskModal(false)} />}
    </motion.div>
  );
}
