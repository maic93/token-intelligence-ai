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
  } | null>(null);

  useEffect(() => {
    import('recharts').then((mod) => setChartComponents(mod));
  }, []);

  const chainData = useMemo(() => {
    if (!data) return [];
    return data.tokensPerChain.map((c) => ({ name: c.chain, count: c.count }));
  }, [data]);

  const riskData = useMemo(() => {
    if (!data) return [];
    const labels: Record<string, string> = {
      very_safe: 'Very Safe',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
    };
    return Object.entries(data.riskDistribution).map(([k, v]) => ({
      name: labels[k] ?? k,
      value: v,
      color:
        k === 'very_safe'
          ? '#22c55e'
          : k === 'low'
            ? '#4ade80'
            : k === 'medium'
              ? '#f59e0b'
              : k === 'high'
                ? '#f87171'
                : '#ef4444',
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

  return (
    <section className="charts-section">
      <h3 className="section-title">Charts</h3>
      <div className="charts-grid">
        <div className="chart-card">
          <h4 className="chart-title">Tokens per Chain</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chainData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3d" />
              <XAxis dataKey="name" stroke="#8b8fa3" fontSize={12} />
              <YAxis stroke="#8b8fa3" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#1a1d28',
                  border: '1px solid #2a2e3d',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#e4e6f0' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h4 className="chart-title">Risk Distribution</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {riskData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1a1d28',
                  border: '1px solid #2a2e3d',
                  borderRadius: 8,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
