import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Activity, Shield } from 'lucide-react';

const API_BASE = '/api';

interface FundingProfile {
  wallet: string;
  fundedBy: string | null;
  fundingTxHash: string | null;
  fundingTimestamp: string | null;
  fundingAmount: string | null;
  fundingSourceType: string;
  fundingSourceLabel: string;
  timeToDeploymentMinutes: number | null;
  clusterId: string | null;
}

interface OverviewData {
  total: number;
  fundedCount: number;
  exchangeCount: number;
  bridgeCount: number;
  eoaCount: number;
  unknownCount: number;
  clusterCount: number;
  averageTimeToDeploy: number | null;
}

interface ClusterData {
  id: string;
  funderWallet: string;
  walletCount: number;
  deployments: number;
  successfulTokens: number;
  highRiskTokens: number;
  chains: string[];
}

export function FundingDashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [profiles, setProfiles] = useState<FundingProfile[]>([]);
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const url = sourceFilter
          ? `${API_BASE}/funding?source=${encodeURIComponent(sourceFilter)}&sort=recent&limit=50`
          : `${API_BASE}/funding?sort=recent&limit=50`;
        const [overviewRes, fundingRes, clusterRes] = await Promise.all([
          fetch(`${API_BASE}/funding/overview`).then((r) => r.json()),
          fetch(url).then((r) => r.json()),
          fetch(`${API_BASE}/funding/clusters`).then((r) => r.json()),
        ]);
        setOverview(overviewRes.data);
        setProfiles(fundingRes.items ?? []);
        setClusters(clusterRes.data ?? []);
      } catch (err) {
        console.error('Failed to load funding data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sourceFilter]);

  if (loading) return <div className="loading">Loading Funding Intelligence...</div>;

  return (
    <div className="funding-dashboard">
      <div className="funding-header">
        <h1>
          <DollarSign size={24} /> Funding Intelligence
        </h1>
        <p>Wallet funding source detection and cluster analysis</p>
      </div>

      {overview && (
        <div className="stats-grid">
          <div className="stat-card">
            <DollarSign size={20} />
            <div>
              <strong>{overview.total}</strong>
              <span>Wallets</span>
            </div>
          </div>
          <div className="stat-card">
            <Shield size={20} />
            <div>
              <strong>{overview.exchangeCount}</strong>
              <span>CEX Funded</span>
            </div>
          </div>
          <div className="stat-card">
            <Activity size={20} />
            <div>
              <strong>{overview.bridgeCount}</strong>
              <span>Bridge Funded</span>
            </div>
          </div>
          <div className="stat-card">
            <Users size={20} />
            <div>
              <strong>{overview.clusterCount}</strong>
              <span>Clusters</span>
            </div>
          </div>
          <div className="stat-card">
            <TrendingUp size={20} />
            <div>
              <strong>
                {overview.averageTimeToDeploy !== null
                  ? `${Math.round(overview.averageTimeToDeploy)}m`
                  : '—'}
              </strong>
              <span>Avg Time to Deploy</span>
            </div>
          </div>
        </div>
      )}

      <div className="filters-row">
        <label>Source:</label>
        {['', 'exchange', 'bridge', 'eoa', 'Unknown'].map((s) => (
          <button
            key={s}
            className={`filter-btn ${sourceFilter === s ? 'active' : ''}`}
            onClick={() => setSourceFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="section">
        <h2>Funding Profiles</h2>
        <div className="wallet-grid">
          {profiles.map((p) => (
            <div key={p.wallet} className="wallet-card">
              <div className="wallet-card-header">
                <span className="wallet-address">
                  {p.wallet.slice(0, 10)}...{p.wallet.slice(-6)}
                </span>
                <span
                  className={`wallet-grade ${p.fundingSourceType === 'exchange' ? 'grade-exchange' : p.fundingSourceType === 'bridge' ? 'grade-bridge' : 'grade-eoa'}`}
                >
                  {p.fundingSourceLabel}
                </span>
              </div>
              <div className="wallet-stats">
                {p.fundedBy && (
                  <div>
                    <strong>From:</strong> {p.fundedBy.slice(0, 8)}...{p.fundedBy.slice(-4)}
                  </div>
                )}
                {p.timeToDeploymentMinutes !== null && (
                  <div>
                    <strong>Time to Deploy:</strong> {Math.round(p.timeToDeploymentMinutes)}m
                  </div>
                )}
                {p.fundingTimestamp && (
                  <div>
                    <strong>Funded:</strong> {new Date(p.fundingTimestamp).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Funding Clusters</h2>
        <div className="wallet-grid">
          {clusters.map((c) => (
            <div key={c.id} className="wallet-card">
              <div className="wallet-card-header">
                <span className="wallet-address">Cluster: {c.funderWallet.slice(0, 10)}...</span>
              </div>
              <div className="wallet-stats">
                <div>
                  <strong>{c.walletCount}</strong> wallets
                </div>
                <div>
                  <strong>{c.deployments}</strong> deployments
                </div>
                <div>
                  <strong>{c.successfulTokens}</strong> successful
                </div>
                <div>
                  <strong>{c.highRiskTokens}</strong> high risk
                </div>
              </div>
              {c.chains.length > 0 && (
                <div className="wallet-labels">
                  {c.chains.map((ch) => (
                    <span key={ch} className="label-badge">
                      {ch}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
