import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, Shield, TrendingUp, Star } from 'lucide-react';
import type { DeployerSummaryItem, DeployerOverview } from '../types';
import { fetchDeployers } from '../api';
import { shortAddress, timeAgo } from '../utils';
import { WalletIntelligence } from './WalletIntelligence';

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

function gradeBadge(grade: string): string {
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

export function DeployersDashboard() {
  const [topDeployers, setTopDeployers] = useState<DeployerSummaryItem[]>([]);
  const [worstDeployers, setWorstDeployers] = useState<DeployerSummaryItem[]>([]);
  const [overview, setOverview] = useState<DeployerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [deployerView, setDeployerView] = useState<'top' | 'worst'>('top');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const loadDeployers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDeployers();
      setTopDeployers(res.top);
      setWorstDeployers(res.worst);
      setOverview(res.overview);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDeployers();
  }, [loadDeployers]);

  const visibleDeployers = deployerView === 'top' ? topDeployers : worstDeployers;

  return (
    <div className="b20-dashboard">
      <div className="b20-header">
        <h1>
          <Users size={24} /> Deployers
        </h1>
        <p className="b20-subtitle">
          Wallet reputation, token creation history, and intelligence scores.
        </p>
      </div>

      {overview && (
        <div className="analytics-cards-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <BarChart3 size={16} />
              <span>Avg Creator Reputation</span>
            </div>
            <div
              className="stat-card-value"
              style={{ color: scoreColor(overview.averageCreatorReputation) }}
            >
              {overview.averageCreatorReputation}/100
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <Star size={16} />
              <span>Best Creator</span>
            </div>
            <div className="stat-card-value">
              {overview.bestCreator ? (
                <span title={overview.bestCreator.wallet}>
                  {shortAddress(overview.bestCreator.wallet)} ({overview.bestCreator.score})
                </span>
              ) : (
                'N/A'
              )}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <Shield size={16} />
              <span>Worst Creator</span>
            </div>
            <div className="stat-card-value">
              {overview.worstCreator ? (
                <span title={overview.worstCreator.wallet}>
                  {shortAddress(overview.worstCreator.wallet)} ({overview.worstCreator.score})
                </span>
              ) : (
                'N/A'
              )}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <Users size={16} />
              <span>Repeat Deployers</span>
            </div>
            <div className="stat-card-value">{overview.repeatDeployers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <TrendingUp size={16} />
              <span>Total Deployers</span>
            </div>
            <div className="stat-card-value">{overview.totalDeployers}</div>
          </div>
        </div>
      )}

      <div className="b20-controls">
        <div className="b20-controls-left">
          <button
            className={`btn ${deployerView === 'top' ? 'btn-primary' : ''}`}
            onClick={() => setDeployerView('top')}
          >
            Top Creators
          </button>
          <button
            className={`btn ${deployerView === 'worst' ? 'btn-primary' : ''}`}
            onClick={() => setDeployerView('worst')}
          >
            Worst Creators
          </button>
        </div>
      </div>

      <div className="b20-table-wrapper">
        <table className="b20-table">
          <thead>
            <tr>
              <th>Wallet</th>
              <th>Tokens Created</th>
              <th>Reputation</th>
              <th>Avg Risk</th>
              <th>Meta Conf</th>
              <th>B20 Conf</th>
              <th>First Seen</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="b20-loading">
                  Loading...
                </td>
              </tr>
            ) : visibleDeployers.length === 0 ? (
              <tr>
                <td colSpan={8} className="b20-loading">
                  No deployers found
                </td>
              </tr>
            ) : (
              visibleDeployers.map((d, i) => (
                <motion.tr
                  key={d.wallet}
                  className="b20-row"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedWallet(d.wallet)}
                >
                  <td className="b20-cell-address" title={d.wallet}>
                    {shortAddress(d.wallet)}
                  </td>
                  <td>{d.tokensCreated}</td>
                  <td>
                    <span
                      className="b20-confidence-badge"
                      style={{ color: gradeColor(d.reputationGrade) }}
                      title={`${d.reputationGrade} (${d.reputationScore}/100)`}
                    >
                      {gradeBadge(d.reputationGrade)} {d.reputationScore}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: scoreColor(d.avgRiskScore) }}>
                      {d.avgRiskScore ?? 'N/A'}
                    </span>
                  </td>
                  <td>{d.avgMetadataConfidence}%</td>
                  <td>{d.avgB20Confidence}%</td>
                  <td>{d.firstSeen ? timeAgo(d.firstSeen) : 'N/A'}</td>
                  <td>{d.lastSeen ? timeAgo(d.lastSeen) : 'N/A'}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedWallet && (
        <WalletIntelligence wallet={selectedWallet} onClose={() => setSelectedWallet(null)} />
      )}
    </div>
  );
}
