import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { TokenData } from '../types';

interface Props {
  token: TokenData;
  onClose: () => void;
}

function scoreColor(score: number | null): string {
  if (score === null) return 'var(--text-muted)';
  if (score <= 20) return '#4ade80';
  if (score <= 40) return '#a3e635';
  if (score <= 60) return '#facc15';
  if (score <= 80) return '#fb923c';
  return '#f87171';
}

function check(val: boolean | undefined, label: string): { label: string; ok: boolean } {
  return { label, ok: val ?? false };
}

export function RiskDetailsModal({ token, onClose }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const checks = [
    check(token.ownerRenounced, 'Ownership Renounced'),
    check(!token.mintable, 'No Mint Function'),
    check(!token.pausable, 'No Pause Function'),
    check(!token.blacklistFunction, 'No Blacklist Function'),
    check(!token.proxyContract, 'Not a Proxy'),
    check(token.verifiedSource, 'Verified Source'),
    check(token.liquidityLocked, 'Liquidity Locked'),
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
      >
        <div className="modal-header">
          <h3>Risk Details — {token.tokenSymbol}</h3>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="risk-score-big" style={{ color: scoreColor(token.riskScore) }}>
            {token.riskScore ?? '?'}
            <span className="risk-score-label">/100 — {token.riskLevel ?? 'Unknown'}</span>
          </div>
          <div className="security-checks">
            {checks.map((c) => (
              <div key={c.label} className={`security-check ${c.ok ? 'pass' : 'fail'}`}>
                <span className="check-icon">{c.ok ? '\u2713' : '\u2717'}</span>
                <span className="check-label">{c.label}</span>
              </div>
            ))}
          </div>
          <div className="risk-extra-details">
            <div className="detail-row">
              <span className="detail-label">Holder Count</span>
              <span className="detail-value">{token.holderCount ?? 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Top 10 Holders</span>
              <span className="detail-value">{token.top10HolderPercent ?? 'N/A'}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Top 1 Holder</span>
              <span className="detail-value">{token.top1HolderPercent ?? 'N/A'}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Buy Tax</span>
              <span className="detail-value">{token.buyTax ?? 'N/A'}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Sell Tax</span>
              <span className="detail-value">{token.sellTax ?? 'N/A'}%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
