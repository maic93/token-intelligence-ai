import { useState, useEffect } from 'react';
import type { PlatformStats } from '../api.js';
import { fetchStats } from '../api.js';

export function StatsSection() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setStats(await fetchStats());
      } catch {
        /* stats unavailable */
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        <StatCard label="Total Tokens" value={stats.totalTokens.toLocaleString()} />
        <StatCard label="Last 24h" value={stats.recentTokens24h.toLocaleString()} />
        <StatCard label="Unique Deployers" value={stats.uniqueDeployers.toLocaleString()} />
        <StatCard label="Active Chains" value={String(stats.chains.length)} />
      </div>
      {stats.chains.length > 1 && (
        <div style={styles.chains}>
          {stats.chains.map((c) => (
            <span key={c.chain} style={styles.chip}>
              {c.chain}: {c.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.card}>
      <div style={styles.value}>{value}</div>
      <div style={styles.label}>{label}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: 24,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12,
  },
  card: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: 12,
    padding: '16px 20px',
    textAlign: 'center',
  },
  value: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#58a6ff',
  },
  label: {
    fontSize: 12,
    color: '#8b949e',
    marginTop: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  chains: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap' as const,
  },
  chip: {
    padding: '4px 12px',
    borderRadius: 20,
    backgroundColor: '#1a2332',
    color: '#8b949e',
    fontSize: 12,
    border: '1px solid #30363d',
  },
};
