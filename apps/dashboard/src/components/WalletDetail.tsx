import { useState } from 'react';
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
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { WalletProfileData } from '../types';
import { explorerUrl, timeAgo } from '../utils';

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

function scoreColor(score: number | null): string {
  if (score === null) return 'var(--text-muted)';
  if (score <= 20) return '#4ade80';
  if (score <= 40) return '#a3e635';
  if (score <= 60) return '#facc15';
  if (score <= 80) return '#fb923c';
  return '#f87171';
}

const PIE_COLORS = ['#4ade80', '#a3e635', '#eab308', '#fb923c', '#f87171'];
const CAT_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9'];

interface Props {
  walletData: WalletProfileData;
  onClose: () => void;
}

export function WalletDetail({ walletData, onClose }: Props) {
  const [copied, setCopied] = useState('');

  function copyAddress(address: string) {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(''), 2000);
  }

  const riskData = walletData.riskDistribution
    ? Object.entries(walletData.riskDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const catData = walletData.categoryDistribution
    ? Object.entries(walletData.categoryDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const timelineData = walletData.timeline?.slice(0, 20).reverse() ?? [];

  const b20Pct = walletData.b20Distribution?.percentage ?? 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content b20-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <h2>
            <Wallet size={18} /> Wallet Intelligence
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="b20-detail-section">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} /> Wallet
            </h3>
            <div className="b20-detail-row">
              <span>Address</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {walletData.wallet}
                <button
                  className="b20-link"
                  onClick={() => copyAddress(walletData.wallet)}
                  title="Copy address"
                >
                  {copied === walletData.wallet ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </span>
            </div>
            <div className="b20-detail-row">
              <span>Wallet Age</span>
              <span>
                {walletData.walletAgeDays !== null ? `${walletData.walletAgeDays} days` : 'Unknown'}
              </span>
            </div>
            <div className="b20-detail-row">
              <span>First Seen</span>
              <span>{walletData.firstSeen ? timeAgo(walletData.firstSeen) : 'N/A'}</span>
            </div>
            <div className="b20-detail-row">
              <span>Last Active</span>
              <span>{walletData.lastSeen ? timeAgo(walletData.lastSeen) : 'N/A'}</span>
            </div>
            {walletData.labels.length > 0 && (
              <div
                className="b20-detail-row"
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
              >
                <span>Labels</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {walletData.labels.map((l) => {
                    const isBad = ['SUSPICIOUS', 'SPAMMER', 'HIGH_RISK_CREATOR'].includes(l);
                    const isGood = ['TRUSTED_CREATOR', 'UTILITY_BUILDER'].includes(l);
                    return (
                      <span
                        key={l}
                        className="b20-confidence-badge"
                        style={{
                          fontSize: 11,
                          background: isBad
                            ? 'rgba(248,113,113,0.15)'
                            : isGood
                              ? 'rgba(74,222,128,0.15)'
                              : 'var(--bg-secondary)',
                          color: isBad ? '#f87171' : isGood ? '#4ade80' : 'var(--text)',
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}
                      >
                        {l}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            <div
              className="b20-detail-row"
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
            >
              <span>Summary</span>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {walletData.summary}
              </p>
            </div>
          </div>

          <div className="b20-detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="b20-detail-section">
              <h3>
                <Star size={14} /> Reputation
              </h3>
              <div className="b20-detail-row">
                <span>Grade</span>
                <span
                  style={{ color: gradeColor(walletData.grade), fontWeight: 600, fontSize: 18 }}
                >
                  {walletData.grade}
                </span>
              </div>
              <div className="b20-detail-row">
                <span>Score</span>
                <span style={{ color: scoreColor(walletData.reputation) }}>
                  {walletData.reputation}/100
                </span>
              </div>
            </div>
            <div className="b20-detail-section">
              <h3>
                <BarChart3 size={14} /> Deployments
              </h3>
              <div className="b20-detail-row">
                <span>Total</span>
                <span>{walletData.totalDeployments}</span>
              </div>
              <div className="b20-detail-row">
                <span>Successful</span>
                <span style={{ color: '#4ade80' }}>{walletData.successfulTokens}</span>
              </div>
              <div className="b20-detail-row">
                <span>High Risk</span>
                <span style={{ color: '#f87171' }}>{walletData.highRiskTokens}</span>
              </div>
              <div className="b20-detail-row">
                <span>B20 Tokens</span>
                <span style={{ color: '#a78bfa' }}>{walletData.b20Tokens}</span>
              </div>
            </div>
          </div>

          <div className="b20-detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="b20-detail-section">
              <h3>
                <Shield size={14} /> Risk Distribution
              </h3>
              {riskData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {riskData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    textAlign: 'center',
                    padding: 20,
                  }}
                >
                  No risk data
                </div>
              )}
            </div>
            <div className="b20-detail-section">
              <h3>
                <TrendingUp size={14} /> AI Categories
              </h3>
              {catData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={catData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {catData.map((_, i) => (
                        <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    textAlign: 'center',
                    padding: 20,
                  }}
                >
                  No category data
                </div>
              )}
            </div>
          </div>

          <div className="b20-detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="b20-detail-section">
              <h3>
                <BarChart3 size={14} /> B20 Distribution
              </h3>
              <div className="b20-detail-row">
                <span>B20 Tokens</span>
                <span>{walletData.b20Tokens}</span>
              </div>
              <div className="b20-detail-row">
                <span>Non-B20</span>
                <span>{walletData.totalDeployments - walletData.b20Tokens}</span>
              </div>
              <div className="b20-detail-row">
                <span>B20 %</span>
                <span>{b20Pct}%</span>
              </div>
            </div>
            <div className="b20-detail-section">
              <h3>
                <Shield size={14} /> Metadata Confidence
              </h3>
              <div className="b20-detail-row">
                <span>Avg Metadata</span>
                <span>{walletData.averageMetadataConfidence}%</span>
              </div>
              <div className="b20-detail-row">
                <span>Avg AI</span>
                <span>{walletData.averageAiConfidence}%</span>
              </div>
              <div className="b20-detail-row">
                <span>Avg Risk</span>
                <span style={{ color: scoreColor(walletData.averageRisk) }}>
                  {walletData.averageRisk ?? 'N/A'}/100
                </span>
              </div>
            </div>
          </div>

          {timelineData.length > 0 && (
            <div className="b20-detail-section">
              <h3>
                <Clock size={14} /> Deployments Over Time
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey={(d) => new Date(d.date).toLocaleDateString()}
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip />
                  <Bar dataKey="riskScore" name="Risk Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="b20-detail-links">
            <a
              href={explorerUrl('base', walletData.wallet)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              <ExternalLink size={14} /> Explorer Wallet
            </a>
            <button className="btn" onClick={() => copyAddress(walletData.wallet)}>
              <Copy size={14} /> Copy Address
            </button>
          </div>

          {walletData.tokens.length > 0 && (
            <div className="b20-detail-section">
              <h3>Recent Deployments ({walletData.tokens.length})</h3>
              <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 12 }}>
                {walletData.tokens.slice(0, 20).map((t) => (
                  <div key={`${t.chain}:${t.contractAddress}`} className="b20-detail-row">
                    <span>
                      <a
                        href={explorerUrl(t.chain, t.contractAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent)', textDecoration: 'none' }}
                      >
                        {t.name || 'Unnamed'} ({t.symbol})
                      </a>
                    </span>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: scoreColor(t.riskScore) }}>{t.riskScore ?? '?'}</span>
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
        </div>
      </div>
    </div>
  );
}
