import { useEffect, useState } from 'react';
import { Trophy, Users, Star, TrendingUp, DollarSign, Activity, Shield } from 'lucide-react';

const API_BASE = '/api/leaderboards';

interface LeaderboardEntry {
  rank: number;
  identifier: string;
  displayName?: string;
  value: number;
  extra?: Record<string, unknown>;
}

const SECTIONS = [
  { key: 'deployers', label: 'Top Deployers', icon: Users, valueLabel: 'Deployments' },
  { key: 'smart-money', label: 'Top Smart Money', icon: Star, valueLabel: 'Score' },
  { key: 'opportunity', label: 'Highest Opportunity', icon: TrendingUp, valueLabel: 'Score' },
  { key: 'lowest-risk', label: 'Lowest Risk', icon: Shield, valueLabel: 'Risk' },
  { key: 'funding', label: 'Largest Funding', icon: DollarSign, valueLabel: 'Deployments' },
  { key: 'chains', label: 'Most Active Chains', icon: Activity, valueLabel: 'Tokens' },
];

export function LeaderboardDashboard() {
  const [boards, setBoards] = useState<Record<string, LeaderboardEntry[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      const results: Record<string, LeaderboardEntry[]> = {};
      await Promise.all(
        SECTIONS.map(async (section) => {
          try {
            const res = await fetch(`${API_BASE}/${section.key}`).then((r) => r.json());
            results[section.key] = res.data ?? [];
          } catch {
            results[section.key] = [];
          }
        }),
      );
      setBoards(results);
      setLoading(false);
    }
    loadAll();
  }, []);

  if (loading) return <div className="loading">Loading leaderboards...</div>;

  return (
    <div className="leaderboard-dashboard">
      <div className="section-header">
        <h1>
          <Trophy size={24} /> Cross-Chain Leaderboards
        </h1>
        <p>Top performers across all chains</p>
      </div>
      <div className="leaderboard-grid">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const entries = boards[section.key] ?? [];
          return (
            <div key={section.key} className="leaderboard-card">
              <div className="leaderboard-card-header">
                <Icon size={18} />
                <h3>{section.label}</h3>
              </div>
              <div className="leaderboard-list">
                {entries.slice(0, 10).map((entry) => (
                  <div key={`${section.key}-${entry.rank}`} className="leaderboard-row">
                    <span
                      className={`leaderboard-rank rank-${entry.rank <= 3 ? entry.rank : 'other'}`}
                    >
                      {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                    </span>
                    <span className="leaderboard-id">
                      {entry.displayName ?? entry.identifier.slice(0, 12) + '...'}
                    </span>
                    <span className="leaderboard-value">
                      {entry.value} {section.valueLabel}
                    </span>
                  </div>
                ))}
                {entries.length === 0 && <div className="leaderboard-empty">No data yet</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
