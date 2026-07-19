import { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Shield,
  TrendingUp,
  BarChart3,
  Clock,
  Star,
  Users,
} from 'lucide-react';
import type { DeployerDetailData } from '../types';
import { fetchDeployer } from '../api';
import { shortAddress, explorerUrl, timeAgo } from '../utils';

function gradeColor(grade: string): string {
  switch (grade) {
    case 'Excellent':
      return '#4ade80';
    case 'Good':
      return '#a3e635';
    case 'Average':
      return '#eab308';
    case 'Poor':
      return '#fb923c';
    case 'Dangerous':
      return '#f87171';
    default:
      return '#9ca3af';
  }
}

function gradeIcon(grade: string): string {
  switch (grade) {
    case 'Excellent':
      return '\u{1F7E2}';
    case 'Good':
      return '\u{1F7E1}';
    case 'Average':
      return '\u{1F7E0}';
    case 'Poor':
      return '\u{1F7E0}';
    case 'Dangerous':
      return '\u{1F534}';
    default:
      return '\u26AA';
  }
}

function scoreColor(score: number | null): string {
  if (score === null) return 'var(--text-muted)';
  if (score <= 20) return '#4ade80';
  if (score <= 40) return '#a3e635';
  if (score <= 60) return '#facc15';
  if (score <= 80) return '#fb923c';
  return '#f87171';
}

interface WalletIntelligenceProps {
  wallet: string;
  onClose: () => void;
}

export function WalletIntelligence({ wallet, onClose }: WalletIntelligenceProps) {
  const [data, setData] = useState<DeployerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchDeployer(wallet);
        if (active) setData(res.data);
      } catch {
        // ignore
      }
      if (active) setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [wallet]);

  function copyAddress(address: string) {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(''), 2000);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content b20-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 700 }}
      >
        <div className="modal-header">
          <h2>Wallet Intelligence</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="b20-loading">Loading deployer data...</div>
          ) : !data ? (
            <div className="b20-loading">Failed to load deployer data</div>
          ) : (
            <>
              <div className="b20-detail-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} /> Wallet
                </h3>
                <div className="b20-detail-row">
                  <span>Address</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {shortAddress(data.deployer)}
                    <button
                      className="b20-link"
                      onClick={() => copyAddress(data.deployer)}
                      title="Copy address"
                    >
                      {copiedAddress === data.deployer ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </span>
                </div>
                <div className="b20-detail-row">
                  <span>Chains</span>
                  <span>{data.chains.join(', ')}</span>
                </div>
              </div>

              <div className="b20-detail-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Star size={16} /> Reputation
                </h3>
                <div className="b20-detail-row">
                  <span>Grade</span>
                  <span
                    style={{
                      color: gradeColor(data.reputation.grade),
                      fontWeight: 600,
                      fontSize: 18,
                    }}
                  >
                    {gradeIcon(data.reputation.grade)} {data.reputation.grade}
                  </span>
                </div>
                <div className="b20-detail-row">
                  <span>Score</span>
                  <span style={{ color: scoreColor(data.reputation.score) }}>
                    {data.reputation.score}/100
                  </span>
                </div>
                {data.reputation.reasons.length > 0 && (
                  <div
                    className="b20-detail-row"
                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
                  >
                    <span>Factors</span>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 16,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {data.reputation.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="b20-detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="b20-detail-section">
                  <h3>
                    <BarChart3 size={14} /> Tokens
                  </h3>
                  <div className="b20-detail-row">
                    <span>Total Created</span>
                    <span>{data.totalContracts}</span>
                  </div>
                  <div className="b20-detail-row">
                    <span>B20 Tokens</span>
                    <span>{data.b20Tokens}</span>
                  </div>
                  <div className="b20-detail-row">
                    <span>Unique Symbols</span>
                    <span>{data.analytics.uniqueSymbols}</span>
                  </div>
                </div>
                <div className="b20-detail-section">
                  <h3>
                    <Shield size={14} /> Risk Distribution
                  </h3>
                  <div className="b20-detail-row">
                    <span style={{ color: '#4ade80' }}>Low Risk</span>
                    <span>{data.analytics.lowRisk}</span>
                  </div>
                  <div className="b20-detail-row">
                    <span style={{ color: '#eab308' }}>Medium Risk</span>
                    <span>{data.analytics.mediumRisk}</span>
                  </div>
                  <div className="b20-detail-row">
                    <span style={{ color: '#f87171' }}>High Risk</span>
                    <span>{data.analytics.highRisk}</span>
                  </div>
                </div>
              </div>

              <div className="b20-detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="b20-detail-section">
                  <h3>
                    <TrendingUp size={14} /> Quality
                  </h3>
                  <div className="b20-detail-row">
                    <span>Avg Risk Score</span>
                    <span>{data.analytics.avgRiskScore ?? 'N/A'}/100</span>
                  </div>
                  <div className="b20-detail-row">
                    <span>Avg Meta Confidence</span>
                    <span>{data.analytics.avgMetadataConfidence}%</span>
                  </div>
                  <div className="b20-detail-row">
                    <span>Avg B20 Confidence</span>
                    <span>{data.analytics.avgB20Confidence}%</span>
                  </div>
                </div>
                <div className="b20-detail-section">
                  <h3>
                    <Clock size={14} /> Timeline
                  </h3>
                  <div className="b20-detail-row">
                    <span>First Seen</span>
                    <span>{data.firstDeployment ? timeAgo(data.firstDeployment) : 'N/A'}</span>
                  </div>
                  <div className="b20-detail-row">
                    <span>Last Active</span>
                    <span>{data.latestDeployment ? timeAgo(data.latestDeployment) : 'N/A'}</span>
                  </div>
                  <div className="b20-detail-row">
                    <span>Total Contracts</span>
                    <span>{data.totalContracts}</span>
                  </div>
                </div>
              </div>

              <div className="b20-detail-links">
                <a
                  href={explorerUrl(data.chains[0] || 'base', data.deployer)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  <ExternalLink size={14} /> Explorer Wallet
                </a>
              </div>

              {data.tokens.length > 0 && (
                <div className="b20-detail-section">
                  <h3>Recent Tokens ({data.tokens.length})</h3>
                  <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 12 }}>
                    {data.tokens.slice(0, 20).map((t) => (
                      <div key={`${t.chain}:${t.contractAddress}`} className="b20-detail-row">
                        <span>
                          <a
                            href={explorerUrl(t.chain, t.contractAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent)', textDecoration: 'none' }}
                          >
                            {t.tokenName || 'Unnamed'} ({t.tokenSymbol})
                          </a>
                        </span>
                        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ color: scoreColor(t.riskScore) }}>
                            {t.riskScore ?? '?'}
                          </span>
                          {t.isB20 && <span style={{ color: '#4ade80', fontSize: 10 }}>B20</span>}
                          <a
                            href={explorerUrl(t.chain, t.contractAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={10} />
                          </a>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
