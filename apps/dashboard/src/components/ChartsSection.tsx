import { useState, useEffect, useMemo } from 'react';
import type { PlatformAnalyticsData } from '../types';
import { fetchPlatformAnalytics } from '../api';

export function ChartsSection() {
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
    const interval = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const [ChartComponents, setChartComponents] = useState<{
    BarChart: typeof import('recharts').BarChart;
    Bar: typeof import('recharts').Bar;
    PieChart: typeof import('recharts').PieChart;
    Pie: typeof import('recharts').Pie;
    Cell: typeof import('recharts').Cell;
    XAxis: typeof import('recharts').XAxis;
    YAxis: typeof import('recharts').YAxis;
    CartesianGrid: typeof import('recharts').CartesianGrid;
    Tooltip: typeof import('recharts').Tooltip;
    ResponsiveContainer: typeof import('recharts').ResponsiveContainer;
    Legend: typeof import('recharts').Legend;
  } | null>(null);

  useEffect(() => {
    import('recharts').then((mod) => setChartComponents(mod as typeof ChartComponents));
  }, []);

  const chainData = useMemo(() => {
    if (!data) return [];
    const colors: Record<string, string> = {
      base: '#0052ff',
      ethereum: '#627eea',
      polygon: '#8247e5',
      robinhood: '#00c853',
    };
    return data.tokensPerChain.map((c) => ({
      name: c.chain,
      count: c.count,
      fill: colors[c.chain] ?? '#6366f1',
    }));
  }, [data]);

  const riskData = useMemo(() => {
    if (!data) return [];
    const labels: Record<string, string> = {
      SAFE: 'Safe',
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      CRITICAL: 'Critical',
    };
    const colors: Record<string, string> = {
      SAFE: '#22c55e',
      LOW: '#84cc16',
      MEDIUM: '#eab308',
      HIGH: '#f97316',
      CRITICAL: '#ef4444',
    };
    return Object.entries(data.riskDistribution).map(([k, v]) => ({
      name: labels[k] ?? k,
      value: v,
      color: colors[k] ?? '#6366f1',
    }));
  }, [data]);

  if (loading && !data) return null;
  if (!data || !ChartComponents) return null;

  const {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } = ChartComponents;

  const sharedTooltip = {
    contentStyle: {
      background: '#181830',
      border: '1px solid #1f1f3a',
      borderRadius: 12,
      fontSize: 12,
    },
    labelStyle: { color: '#ededf5' },
    itemStyle: { color: '#8888a0' },
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <div className="section-header">
        <h2 className="section-title">Analytics</h2>
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Tokens per Chain</h3>
            <div className="chart-legend">
              {chainData.map((c) => (
                <div key={c.name} className="legend-item">
                  <span className="legend-dot" style={{ background: c.fill }} />
                  {c.name}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chainData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f3a" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#5c5c78"
                fontSize={12}
                axisLine={false}
                tickLine={false}
              />
              <YAxis stroke="#5c5c78" fontSize={12} axisLine={false} tickLine={false} />
              <Tooltip {...sharedTooltip} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {chainData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Risk Distribution</h3>
            <div className="chart-legend">
              {riskData.map((r) => (
                <div key={r.name} className="legend-item">
                  <span className="legend-dot" style={{ background: r.color }} />
                  {r.name}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                paddingAngle={2}
              >
                {riskData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...sharedTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
