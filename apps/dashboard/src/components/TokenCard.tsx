import { useState } from 'react';
import type { TokenData } from '../types';
import { explorerUrl, shortAddress, timeAgo } from '../utils';

interface TokenCardProps {
  token: TokenData;
  isNew?: boolean;
}

export function TokenCard({ token, isNew }: TokenCardProps) {
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
        <span className="chain-badge" data-chain={token.chain}>
          {token.chain}
        </span>
        <span className="token-symbol">{token.tokenSymbol}</span>
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
      </div>
    </div>
  );
}
