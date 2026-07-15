import { useStats } from '../hooks/useStats';
import { StatCard } from './StatCard';

export function StatsSection() {
  const { stats, loading } = useStats();

  return (
    <section className="stats-section">
      <StatCard label="Total Tokens" value={stats?.totalTokens ?? 0} loading={loading} />
      <StatCard label="New (24h)" value={stats?.recentTokens24h ?? 0} loading={loading} />
      <StatCard label="Unique Deployers" value={stats?.uniqueDeployers ?? 0} loading={loading} />
      <StatCard label="Indexed Chains" value={stats?.chains.length ?? 0} loading={loading} />
    </section>
  );
}
