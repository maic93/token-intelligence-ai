import { useEffect, useState } from 'react';
import {
  Shield,
  TrendingUp,
  Activity,
  Brain,
  Star,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { getExplorerAddress } from '../utils';
import type { SmartMoneyProfileData } from '../types';

interface WalletDetailResponse {
  data: {
    profile: SmartMoneyProfileData;
    recentDeployments: {
      contractAddress: string;
      chain: string;
      name: string;
      symbol: string;
      riskScore: number | null;
      riskLevel: string | null;
      aiCategory: string;
      aiConfidence: number;
      discoveredAt: string;
    }[];
    categories: Record<string, number>;
    riskDistribution: Record<string, number>;
  };
}

const API_BASE = '/api';

export function SmartMoneyWallet({ wallet }: { wallet: string }) {
  const [detail, setDetail] = useState<WalletDetailResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = (await fetch(`${API_BASE}/smart-money/${encodeURIComponent(wallet)}`).then(
          (r) => r.json(),
        )) as WalletDetailResponse;
        setDetail(res.data);
      } catch (err) {
        console.error('Failed to load smart money wallet', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [wallet]);

  if (loading) return <div className="loading">Loading wallet detail...</div>;
  if (!detail) return <div className="error">Wallet not found</div>;

  const { profile, recentDeployments, categories, riskDistribution } = detail;
  const gradeColors: Record<string, string> = {
    Elite: '#a78bfa',
    Professional: '#60a5fa',
    Experienced: '#4ade80',
    Average: '#fbbf24',
    Speculative: '#fb923c',
    Dangerous: '#f87171',
  };

  return (
    <div className="smart-money-wallet">
      <div className="wallet-detail-header">
        <h2>
          <Shield size={24} /> {profile.wallet.slice(0, 10)}...{profile.wallet.slice(-6)}
        </h2>
        <span
          className="wallet-grade"
          style={{ background: gradeColors[profile.grade] || '#6b7280' }}
        >
          {profile.grade} — {profile.score}/100
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Star size={20} />
          <div>
            <strong>{profile.score}</strong>
            <span>Score</span>
          </div>
        </div>
        <div className="stat-card">
          <Activity size={20} />
          <div>
            <strong>{profile.winRate}%</strong>
            <span>Win Rate</span>
          </div>
        </div>
        <div className="stat-card">
          <Brain size={20} />
          <div>
            <strong>{profile.tokensCreated}</strong>
            <span>Tokens Created</span>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={20} />
          <div>
            <strong>{profile.averageRisk ?? '—'}</strong>
            <span>Avg Risk</span>
          </div>
        </div>
        <div className="stat-card">
          <Shield size={20} />
          <div>
            <strong>{profile.successfulTokens}</strong>
            <span>Successful</span>
          </div>
        </div>
        <div className="stat-card">
          <AlertTriangle size={20} />
          <div>
            <strong>{profile.failedTokens}</strong>
            <span>Failed</span>
          </div>
        </div>
      </div>

      {profile.labels.length > 0 && (
        <div className="labels-section">
          <h3>Labels</h3>
          <div className="labels-row">
            {profile.labels.map((l: string) => (
              <span key={l} className="label-badge">
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="wallet-summary">{profile.summary}</p>

      <div className="analytics-grid">
        <div className="chart-card">
          <h3>
            <Brain size={16} /> AI Categories
          </h3>
          <div className="bar-chart">
            {Object.entries(categories)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <div key={cat} className="bar-item">
                  <span className="bar-label">{cat}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(count / Math.max(...Object.values(categories))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="bar-value">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="chart-card">
          <h3>
            <Shield size={16} /> Risk Distribution
          </h3>
          <div className="bar-chart">
            {Object.entries(riskDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([level, count]) => (
                <div key={level} className="bar-item">
                  <span className="bar-label">{level}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(count / Math.max(...Object.values(riskDistribution))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="bar-value">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="deployments-section">
        <h3>Recent Deployments</h3>
        <table className="deployments-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Chain</th>
              <th>Risk</th>
              <th>Category</th>
              <th>AI Conf</th>
              <th>Explorer</th>
            </tr>
          </thead>
          <tbody>
            {recentDeployments.map((t) => (
              <tr key={`${t.chain}-${t.contractAddress}`}>
                <td>
                  {t.name} ({t.symbol})
                </td>
                <td>{t.chain}</td>
                <td>
                  <span className={`risk-badge risk-${(t.riskLevel || 'UNKNOWN').toLowerCase()}`}>
                    {t.riskLevel || '?'}
                  </span>
                </td>
                <td>{t.aiCategory}</td>
                <td>{t.aiConfidence}</td>
                <td>
                  <a
                    href={getExplorerAddress(t.chain, t.contractAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={14} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
