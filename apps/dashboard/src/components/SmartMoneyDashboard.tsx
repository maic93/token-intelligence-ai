import { useEffect, useState } from 'react';
import { TrendingUp, Shield, Users, Brain, Star, Activity } from 'lucide-react';
import type { SmartMoneyProfileData } from '../types';

const API_BASE = '/api';

interface OverviewData {
  total: number;
  averageScore: number;
  eliteCount: number;
  professionalCount: number;
  experiencedCount: number;
  averageCount: number;
  speculativeCount: number;
  dangerousCount: number;
  averageWinRate: number;
}

export function SmartMoneyDashboard() {
  const [profiles, setProfiles] = useState<SmartMoneyProfileData[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        const url = gradeFilter
          ? `${API_BASE}/smart-money/grade/${encodeURIComponent(gradeFilter)}?limit=50`
          : `${API_BASE}/smart-money/top`;
        const [profilesRes, overviewRes] = await Promise.all([
          fetch(url).then((r) => r.json()),
          fetch(`${API_BASE}/smart-money/overview`).then((r) => r.json()),
        ]);
        setProfiles(profilesRes.data);
        setOverview(overviewRes.data);
      } catch (err) {
        console.error('Failed to load smart money data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [gradeFilter]);

  const gradeColors: Record<string, string> = {
    Elite: '#a78bfa',
    Professional: '#60a5fa',
    Experienced: '#4ade80',
    Average: '#fbbf24',
    Speculative: '#fb923c',
    Dangerous: '#f87171',
  };

  if (loading) return <div className="loading">Loading Smart Money data...</div>;

  return (
    <div className="smart-money-dashboard">
      <div className="smart-money-header">
        <h1>
          <TrendingUp size={24} /> Smart Money Intelligence
        </h1>
        <p>Deterministic wallet scoring and smart money detection</p>
      </div>

      {overview && (
        <div className="stats-grid">
          <div className="stat-card">
            <Shield size={20} />
            <div>
              <strong>{overview.eliteCount}</strong>
              <span>Elite</span>
            </div>
          </div>
          <div className="stat-card">
            <Users size={20} />
            <div>
              <strong>{overview.professionalCount}</strong>
              <span>Professional</span>
            </div>
          </div>
          <div className="stat-card">
            <Brain size={20} />
            <div>
              <strong>{overview.dangerousCount}</strong>
              <span>Dangerous</span>
            </div>
          </div>
          <div className="stat-card">
            <Activity size={20} />
            <div>
              <strong>{overview.averageScore}</strong>
              <span>Avg Score</span>
            </div>
          </div>
          <div className="stat-card">
            <Star size={20} />
            <div>
              <strong>{overview.averageWinRate}%</strong>
              <span>Avg Win Rate</span>
            </div>
          </div>
          <div className="stat-card">
            <Users size={20} />
            <div>
              <strong>{overview.total}</strong>
              <span>Total Wallets</span>
            </div>
          </div>
        </div>
      )}

      <div className="filters-row">
        <label>Grade:</label>
        {['', 'Elite', 'Professional', 'Experienced', 'Average', 'Speculative', 'Dangerous'].map(
          (g) => (
            <button
              key={g}
              className={`filter-btn ${gradeFilter === g ? 'active' : ''}`}
              onClick={() => setGradeFilter(g)}
            >
              {g || 'All'}
            </button>
          ),
        )}
      </div>

      <div className="wallet-grid">
        {profiles.map((p) => (
          <div
            key={p.wallet}
            className="wallet-card"
            style={{ borderLeftColor: gradeColors[p.grade] || '#6b7280' }}
          >
            <div className="wallet-card-header">
              <span className="wallet-address" title={p.wallet}>
                {p.wallet.slice(0, 10)}...{p.wallet.slice(-6)}
              </span>
              <span
                className="wallet-grade"
                style={{ background: gradeColors[p.grade] || '#6b7280' }}
              >
                {p.grade}
              </span>
            </div>
            <div className="wallet-score">
              {p.score}
              <small>/100</small>
            </div>
            <div className="wallet-stats">
              <div>
                <strong>{p.tokensCreated}</strong> tokens
              </div>
              <div>
                <strong>{p.winRate}%</strong> win rate
              </div>
              <div>
                <strong>{p.averageRisk ?? '—'}</strong> avg risk
              </div>
            </div>
            <div className="wallet-labels">
              {p.labels.map((l: string) => (
                <span key={l} className="label-badge">
                  {l}
                </span>
              ))}
            </div>
            <p className="wallet-summary">{p.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
