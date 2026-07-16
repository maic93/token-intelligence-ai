import { useState } from 'react';
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
}

function scoreColor(score: number | null): string {
  if (score === null) return 'var(--text-secondary)';
  if (score <= 20) return 'var(--green)';
  if (score <= 40) return '#4ade80';
  if (score <= 60) return 'var(--orange)';
  if (score <= 80) return '#f87171';
  return 'var(--red)';
}

function riskBadgeClass(level: string | null): string {
  switch (level) {
    case 'SAFE':
      return 'risk-safe';
    case 'LOW':
      return 'risk-low';
    case 'MEDIUM':
      return 'risk-medium';
    case 'HIGH':
      return 'risk-high';
    case 'CRITICAL':
      return 'risk-critical';
    default:
      return 'risk-unknown';
  }
}

function riskLabel(level: string | null): string {
  switch (level) {
    case 'SAFE':
      return 'Safe';
    case 'LOW':
      return 'Low Risk';
    case 'MEDIUM':
      return 'Medium Risk';
    case 'HIGH':
      return 'High Risk';
    case 'CRITICAL':
      return 'Critical';
    default:
      return '—';
  }
}

export function TokenCard({ token, isNew, onAnalytics, isWatched, onToggleWatch }: TokenCardProps) {
  const [copied, setCopied] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(token.contractAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={`token-card ${isNew ? 'token-card-new' : ''}`}>
      {isNew && <span className="new-badge">NEW</span>}
      <div className="token-card-header">
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
        <span className="chain-badge" data-chain={token.chain}>
          {token.chain}
        </span>
        <span className="token-symbol">{token.tokenSymbol}</span>
        {token.riskScore !== null && token.riskScore !== undefined && (
          <span
            className="risk-score-badge"
            style={{ color: scoreColor(token.riskScore) }}
            title={`Risk Score: ${token.riskScore}/100`}
          >
            {token.riskScore}
          </span>
        )}
        {token.riskLevel && (
          <span
            className={`risk-badge ${riskBadgeClass(token.riskLevel)}`}
            title={`Risk Score: ${token.riskScore ?? '?'}/100`}
          >
            {riskLabel(token.riskLevel)}
          </span>
        )}
      </div>
      <div className="token-name">{token.tokenName}</div>
      <div className="token-address" title={token.contractAddress}>
        {shortAddress(token.contractAddress)}
      </div>
      <div className="token-details">
        <div className="detail-row">
          <span className="detail-label">Deployer</span>
          <span className="detail-value" title={token.deployer}>
            {shortAddress(token.deployer)}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Decimals</span>
          <span className="detail-value">{token.decimals}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Supply</span>
          <span className="detail-value">{shortAddress(token.totalSupply)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Block</span>
          <span className="detail-value">{token.blockNumber}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Discovered</span>
          <span className="detail-value">{timeAgo(token.blockTimestamp)}</span>
        </div>
      </div>
      <div className="token-card-actions">
        <button className="btn btn-copy" onClick={handleCopy} type="button">
          {copied ? 'Copied!' : 'Copy Address'}
        </button>
        <a
          className="btn btn-explorer"
          href={explorerUrl(token.chain, token.contractAddress)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Explorer
        </a>
        {onAnalytics && (
          <button
            className="btn btn-analytics"
            onClick={() => onAnalytics(token.chain, token.contractAddress)}
            type="button"
          >
            Analytics
          </button>
        )}
        {token.riskLevel && (
          <button className="btn btn-risk" onClick={() => setShowRiskModal(true)} type="button">
            Risk Details
          </button>
        )}
      </div>
      {showRiskModal && <RiskDetailsModal token={token} onClose={() => setShowRiskModal(false)} />}
    </div>
  );
}
