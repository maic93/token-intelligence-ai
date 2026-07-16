import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchPlatformAnalytics } from '../api';
import { shortAddress } from '../utils';
import { Database, Shield, TrendingUp, Calendar, BarChart3, User } from 'lucide-react';

interface AnalyticsCard {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

export function AnalyticsCards() {
  const [data, setData] = useState<
    Awaited<ReturnType<typeof fetchPlatformAnalytics>>['data'] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchPlatformAnalytics();
        if (active) setData(res.data);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="stats-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-stat">
            <div className="skeleton skeleton-stat-icon" />
            <div className="skeleton-stat-body">
              <div className="skeleton skeleton-line skeleton-line-lg" />
              <div className="skeleton skeleton-line skeleton-line-sm" style={{ marginTop: 6 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const topChain =
    data.tokensPerChain.length > 0
      ? data.tokensPerChain.reduce((a, b) => (a.count > b.count ? a : b))
      : null;

  const cards: AnalyticsCard[] = [
    {
      icon: <Database size={18} />,
      label: 'Total Tokens',
      value: data.totalTokens.toLocaleString(),
      color: 'accent',
    },
    {
      icon: <Shield size={18} />,
      label: 'Average Risk',
      value: data.averageRiskScore !== null ? `${data.averageRiskScore}/100` : '—',
      color: 'green',
    },
    {
      icon: <TrendingUp size={18} />,
      label: 'New Today',
      value: data.tokensToday.toLocaleString(),
      color: 'yellow',
    },
    {
      icon: <Calendar size={18} />,
      label: 'New This Week',
      value: data.tokensThisWeek.toLocaleString(),
      color: 'orange',
    },
    {
      icon: <BarChart3 size={18} />,
      label: `Top Chain: ${topChain?.chain ?? '—'}`,
      value: topChain ? topChain.count.toLocaleString() : '—',
      color: 'accent',
    },
    {
      icon: <User size={18} />,
      label: 'Top Deployer',
      value: data.topDeployers[0] ? shortAddress(data.topDeployers[0].deployer) : '—',
      color: 'green',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          className="stat-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          whileHover={{ y: -2 }}
        >
          <div className={`stat-card-icon ${c.color}`}>{c.icon}</div>
          <div className="stat-card-body">
            <div className="stat-card-value">{c.value}</div>
            <div className="stat-card-label">{c.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
