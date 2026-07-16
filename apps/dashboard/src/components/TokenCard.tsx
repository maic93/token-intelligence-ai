import { useState } from 'react';
import type { TokenData } from '../types';
import { explorerUrl, shortAddress, timeAgo } from '../utils';
import { WatchButton } from './WatchButton';

interface TokenCardProps {
  token: TokenData;
  isNew?: boolean;
  onAnalytics?: (chain: string, address: string) => void;
  isWatched?: boolean;
  onToggleWatch?: () => void;
}

function riskBadgeClass(level: string | null): string {
  switch (level) {
    case 'very_safe':
      return 'risk-very-safe';
    case 'low':
      return 'risk-low';
    case 'medium':
      return 'risk-medium';
    case 'high':
      return 'risk-high';
    case 'critical':
      return 'risk-critical';
    default:
      return 'risk-unknown';
  }
}

function riskLabel(level: string | null): string {
  switch (level) {
    case 'very_safe':
      return 'Very Safe';
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    case 'critical':
      return 'Critical';
    default:
      return '—';
  }
}

export function TokenCard({ token, isNew, onAnalytics, isWatched, onToggleWatch }: TokenCardProps) {
  const [copied, setCopied] = useState(false);

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
      </div>
    </div>
  );
}
