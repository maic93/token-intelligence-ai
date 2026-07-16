import { useState, useEffect } from 'react';
import type { PlatformAnalyticsData } from '../types';
import { fetchPlatformAnalytics } from '../api';
import { shortAddress } from '../utils';

export function AnalyticsCards() {
  const [data, setData] = useState<PlatformAnalyticsData | null>(null);
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
      <section className="stats-section">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="stat-card">
            <div className="skeleton stat-skeleton" />
            <div className="skeleton skeleton-line-sm" style={{ margin: '0 auto' }} />
          </div>
        ))}
      </section>
    );
  }

  if (!data) return null;

  const topChain =
    data.tokensPerChain.length > 0
      ? data.tokensPerChain.reduce((a, b) => (a.count > b.count ? a : b))
      : null;

  const cards = [
    { label: 'Total Tokens', value: data.totalTokens.toLocaleString() },
    {
      label: 'Average Risk',
      value: data.averageRiskScore !== null ? `${data.averageRiskScore}/100` : '—',
    },
    { label: 'New Today', value: data.tokensToday.toLocaleString() },
    { label: 'New This Week', value: data.tokensThisWeek.toLocaleString() },
    {
      label: `Top Chain: ${topChain?.chain ?? '—'}`,
      value: topChain ? topChain.count.toLocaleString() : '—',
    },
    {
      label: 'Top Deployer',
      value: data.topDeployers[0] ? shortAddress(data.topDeployers[0].deployer) : '—',
    },
  ];

  return (
    <section className="stats-section">
      {cards.map((c) => (
        <div key={c.label} className="stat-card">
          <div className="stat-value">{c.value}</div>
          <div className="stat-label">{c.label}</div>
        </div>
      ))}
    </section>
  );
}
