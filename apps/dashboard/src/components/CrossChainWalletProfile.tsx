import { useEffect, useState } from 'react';
import { Globe, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { fetchWallets } from '../api';
import type { WalletProfileData } from '../types';

function getExplorerUrl(wallet: string, chains: string[]): string {
  const baseUrl = chains.includes('base')
    ? 'https://basescan.org'
    : chains.includes('robinhood')
      ? 'https://robinhoodchain.blockscout.com'
      : chains.includes('ethereum')
        ? 'https://etherscan.io'
        : 'https://polygonscan.com';
  return `${baseUrl}/address/${wallet}`;
}

export function CrossChainWalletProfile() {
  const [wallets, setWallets] = useState<WalletProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchWallets({ limit: 10, sort: 'reputation_desc' })
      .then((res) => setWallets(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton skeleton-line" />;

  return (
    <div className="cross-chain-wallet-profile">
      <h2>
        <Globe size={18} /> Cross-Chain Wallet Profiles
      </h2>
      <div className="wallet-profile-list">
        {wallets.map((w) => (
          <div key={w.wallet} className="wallet-profile-card">
            <div
              className="wallet-profile-header"
              onClick={() => setExpanded(expanded === w.wallet ? null : w.wallet)}
            >
              <div className="wallet-profile-meta">
                <span className="wallet-address">
                  {w.wallet.slice(0, 10)}...{w.wallet.slice(-6)}
                </span>
                <span className={`grade-badge grade-${w.grade.toLowerCase()}`}>{w.grade}</span>
                <span className="reputation-score">Rep: {w.reputation}/100</span>
              </div>
              <div className="wallet-profile-stats">
                <span>{w.totalDeployments} deployments</span>
                <span>{w.labels?.length ?? 0} labels</span>
              </div>
              {expanded === w.wallet ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {expanded === w.wallet && (
              <div className="wallet-profile-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>First Seen</label>
                    <span>{w.firstSeen ? new Date(w.firstSeen).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Seen</label>
                    <span>{w.lastSeen ? new Date(w.lastSeen).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Successful</label>
                    <span>{w.successfulTokens}</span>
                  </div>
                  <div className="detail-item">
                    <label>High Risk</label>
                    <span className="risk-high">{w.highRiskTokens}</span>
                  </div>
                  <div className="detail-item">
                    <label>Avg Risk</label>
                    <span>{w.averageRisk?.toFixed(1) ?? 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>B20 Tokens</label>
                    <span>{w.b20Tokens}</span>
                  </div>
                  <div className="detail-item">
                    <label>Wallet Age</label>
                    <span>{w.walletAgeDays ? `${w.walletAgeDays}d` : 'N/A'}</span>
                  </div>
                </div>
                {w.summary && <p className="wallet-summary">{w.summary}</p>}
                <a
                  className="btn btn-sm"
                  href={getExplorerUrl(w.wallet, ['base'])}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={11} /> Explorer
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
