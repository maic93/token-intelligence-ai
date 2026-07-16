import { useStats } from '../hooks/useStats';
import { StatCard } from './StatCard';
import { Database, Clock, Users, Layers } from 'lucide-react';

export function StatsSection() {
  const { stats, loading } = useStats();

  const cards = [
    {
      icon: <Database size={18} />,
      label: 'Total Tokens',
      value: stats?.totalTokens ?? 0,
      color: 'accent' as const,
      trend: 'up' as const,
      trendLabel: '+12%',
    },
    {
      icon: <Clock size={18} />,
      label: 'New (24h)',
      value: stats?.recentTokens24h ?? 0,
      color: 'green' as const,
      trend: stats && stats.recentTokens24h > 0 ? ('up' as const) : ('neutral' as const),
    },
    {
      icon: <Users size={18} />,
      label: 'Unique Deployers',
      value: stats?.uniqueDeployers ?? 0,
      color: 'yellow' as const,
    },
    {
      icon: <Layers size={18} />,
      label: 'Indexed Chains',
      value: stats?.chains.length ?? 0,
      color: 'orange' as const,
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((c, i) => (
        <StatCard key={c.label} {...c} loading={loading} index={i} />
      ))}
    </div>
  );
}
