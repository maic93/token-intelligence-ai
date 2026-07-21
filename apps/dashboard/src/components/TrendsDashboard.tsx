import { useEffect, useState } from 'react';
import { TrendingUp, Activity, Shield, Users, Brain, Database, Radio } from 'lucide-react';
import { fetchTrends } from '../api';
import { getExplorerAddress, shortAddress } from '../utils';
import type { TrendData } from '../types';

function BarChart({
  data,
  height = 120,
  color = '#6366f1',
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = Math.max(30, Math.floor(600 / data.length));
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${data.length * (w + 4)} ${height}`}
      style={{ minHeight: height }}
    >
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 20);
        return (
          <g key={i}>
            <rect
              x={i * (w + 4)}
              y={height - 15 - barH}
              width={w}
              height={barH}
              fill={color}
              rx={2}
            />
            <text
              x={i * (w + 4) + w / 2}
              y={height - 2}
              textAnchor="middle"
              fontSize={9}
              fill="var(--text-muted)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PieChart({
  data,
  size = 120,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  function renderSlice(startAngle: number, angle: number, fillColor: string, key: number) {
    if (angle <= 0) return null;
    const r1 = Math.PI / 180;
    const x1 = cx + r * Math.cos(startAngle * r1);
    const y1 = cy + r * Math.sin(startAngle * r1);
    const x2 = cx + r * Math.cos((startAngle + angle) * r1);
    const y2 = cy + r * Math.sin((startAngle + angle) * r1);
    const large = angle > 180 ? 1 : 0;
    return (
      <path
        key={key}
        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
        fill={fillColor}
      />
    );
  }

  const slices: React.ReactNode[] = [];
  let currentAngle = -90;
  data.forEach((d, i) => {
    if (d.value === 0) return;
    const angle = (d.value / total) * 360;
    slices.push(renderSlice(currentAngle, angle, d.color, i));
    currentAngle += angle;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices}
    </svg>
  );
}

export function TrendsDashboard() {
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchTrends();
        if (active) setTrends(res.data);
      } catch {
        /* ignore */
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

  const data = trends;

  const PIE_COLORS: Record<string, string> = {
    MEME: '#f59e0b',
    AI: '#6366f1',
    DEFI: '#10b981',
    NFT: '#ec4899',
    GAMING: '#8b5cf6',
    UTILITY: '#06b6d4',
    B20: '#a78bfa',
    UNKNOWN: '#6b7280',
  };

  const catPie =
    data?.categories?.map((c) => ({
      label: c.category,
      value: c.tokens24h,
      color: PIE_COLORS[c.category] || '#6b7280',
    })) ?? [];

  const hourData =
    data?.hourly?.map((h) => ({
      label: new Date(h.timestamp).getHours().toString().padStart(2, '0') + 'h',
      value: h.tokensIndexed,
    })) ?? [];

  const dayData =
    data?.daily?.map((d) => ({
      label: new Date(d.timestamp).getDate().toString(),
      value: d.tokensIndexed,
    })) ?? [];

  const chainPie =
    data?.chains?.map((c, i) => ({
      label: c.chain,
      value: c.tokensDay,
      color: ['#4ade80', '#a78bfa', '#60a5fa', '#fbbf24'][i] || '#6b7280',
    })) ?? [];

  return (
    <div className="trends-dashboard">
      <div className="trends-header">
        <h1>
          <TrendingUp size={24} /> Trends
        </h1>
        <p className="trends-subtitle">Historical analytics and trending intelligence</p>
      </div>

      {loading ? (
        <div className="skeleton skeleton-line" />
      ) : !data ? (
        <div className="empty-state">No trend data available</div>
      ) : (
        <>
          <div className="trends-stats">
            <div className="stat-card">
              <div className="stat-card-header">
                <Database size={16} /> Tokens Today
              </div>
              <div className="stat-card-value" style={{ color: '#4ade80' }}>
                {data.overview.tokensToday}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <Activity size={16} /> Tokens This Hour
              </div>
              <div className="stat-card-value" style={{ color: '#a3e635' }}>
                {data.overview.tokensThisHour}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <Shield size={16} /> Avg Risk
              </div>
              <div className="stat-card-value">{data.overview.averageRisk ?? '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <Users size={16} /> Avg Metadata
              </div>
              <div className="stat-card-value">{data.overview.averageMetadata ?? '—'}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <Brain size={16} /> Avg AI Confidence
              </div>
              <div className="stat-card-value">{data.overview.averageAIConfidence ?? '—'}%</div>
            </div>
          </div>

          <div className="trends-grid">
            <div className="trends-section">
              <h3>
                <Activity size={16} /> Hourly Launches
              </h3>
              <div className="trends-chart">
                <BarChart data={hourData} color="#6366f1" height={150} />
              </div>
            </div>

            <div className="trends-section">
              <h3>
                <Activity size={16} /> Daily Launches
              </h3>
              <div className="trends-chart">
                <BarChart data={dayData} color="#10b981" height={150} />
              </div>
            </div>

            <div className="trends-section">
              <h3>
                <Database size={16} /> Category Distribution (24h)
              </h3>
              <div
                className="trends-chart"
                style={{ display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <PieChart data={catPie} size={140} />
                <div className="trends-legend">
                  {catPie
                    .filter((c) => c.value > 0)
                    .map((c) => (
                      <div key={c.label} className="trends-legend-item">
                        <span
                          style={{
                            backgroundColor: c.color,
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            display: 'inline-block',
                          }}
                        />
                        <span>{c.label}</span>
                        <span className="trends-legend-value">{c.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="trends-section">
              <h3>
                <Radio size={16} /> Chain Distribution (24h)
              </h3>
              <div
                className="trends-chart"
                style={{ display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <PieChart data={chainPie} size={140} />
                <div className="trends-legend">
                  {chainPie
                    .filter((c) => c.value > 0)
                    .map((c) => (
                      <div key={c.label} className="trends-legend-item">
                        <span
                          style={{
                            backgroundColor: c.color,
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            display: 'inline-block',
                          }}
                        />
                        <span>{c.label}</span>
                        <span className="trends-legend-value">{c.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="trends-section">
            <h3>
              <Database size={16} /> Category Trends (24h)
            </h3>
            <div className="trends-table-wrapper">
              <table className="trends-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>24h Tokens</th>
                    <th>7d Tokens</th>
                    <th>Growth</th>
                    <th>Avg Risk</th>
                    <th>Avg Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {data.categories?.map((c) => (
                    <tr key={c.category}>
                      <td>
                        <span className={`category-badge category-${c.category.toLowerCase()}`}>
                          {c.category}
                        </span>
                      </td>
                      <td>{c.tokens24h}</td>
                      <td>{c.tokens7d}</td>
                      <td style={{ color: (c.growthPercent ?? 0) >= 0 ? '#4ade80' : '#f87171' }}>
                        {c.growthPercent != null
                          ? `${c.growthPercent >= 0 ? '+' : ''}${c.growthPercent}%`
                          : '—'}
                      </td>
                      <td>{c.averageRisk ?? '—'}</td>
                      <td>{c.averageConfidence != null ? `${c.averageConfidence}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(data.trendingTokens?.length ?? 0) > 0 && (
            <div className="trends-section">
              <h3>
                <TrendingUp size={16} /> Trending Tokens
              </h3>
              <p className="trends-subtitle">Top tokens in the last 24 hours</p>
              <div className="trends-table-wrapper">
                <table className="trends-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Chain</th>
                      <th>AI Confidence</th>
                      <th>B20</th>
                      <th>Metadata</th>
                      <th>Risk</th>
                      <th>Reputation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trendingTokens?.slice(0, 20).map((t) => (
                      <tr key={`${t.chain}-${t.contractAddress}`}>
                        <td>
                          <a
                            href={getExplorerAddress(t.chain, t.contractAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="trends-link"
                          >
                            {t.name} ({t.symbol})
                          </a>
                        </td>
                        <td>
                          <span className={`chain-badge chain-badge-${t.chain}`}>{t.chain}</span>
                        </td>
                        <td>{t.aiConfidence}%</td>
                        <td>{t.b20Confidence}%</td>
                        <td>{t.metadataConfidence}%</td>
                        <td
                          style={{
                            color:
                              t.riskScore != null
                                ? t.riskScore > 60
                                  ? '#f87171'
                                  : t.riskScore > 30
                                    ? '#eab308'
                                    : '#4ade80'
                                : 'inherit',
                          }}
                        >
                          {t.riskScore ?? '—'}
                        </td>
                        <td>{t.deployerReputation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="trends-section">
            <h3>
              <Users size={16} /> Top Deployers
            </h3>
            <div className="trends-table-wrapper">
              <table className="trends-table">
                <thead>
                  <tr>
                    <th>Wallet</th>
                    <th>Tokens</th>
                    <th>Avg Risk</th>
                    <th>Avg Metadata</th>
                    <th>Avg AI</th>
                    <th>Reputation</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deployers?.slice(0, 20).map((d) => (
                    <tr key={d.wallet}>
                      <td>
                        <a
                          href={getExplorerAddress('base', d.wallet)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="trends-link"
                        >
                          {shortAddress(d.wallet)}
                        </a>
                      </td>
                      <td>{d.tokensIndexed}</td>
                      <td>{d.averageRisk ?? '—'}</td>
                      <td>
                        {d.averageMetadataConfidence != null
                          ? `${d.averageMetadataConfidence}%`
                          : '—'}
                      </td>
                      <td>{d.averageAIConfidence != null ? `${d.averageAIConfidence}%` : '—'}</td>
                      <td>{d.reputation}</td>
                      <td>
                        <span className={`grade-badge grade-${d.grade?.toLowerCase()}`}>
                          {d.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="trends-section">
            <h3>
              <Radio size={16} /> Chain Trends (24h)
            </h3>
            <div className="trends-table-wrapper">
              <table className="trends-table">
                <thead>
                  <tr>
                    <th>Chain</th>
                    <th>Tokens Today</th>
                    <th>Avg Reputation</th>
                    <th>Avg Risk</th>
                    <th>Avg Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chains?.map((c) => (
                    <tr key={c.chain}>
                      <td>
                        <span className={`chain-badge chain-badge-${c.chain}`}>{c.chain}</span>
                      </td>
                      <td>{c.tokensDay}</td>
                      <td>{c.averageDeployerReputation ?? '—'}</td>
                      <td>{c.averageRisk ?? '—'}</td>
                      <td>
                        {c.averageMetadataConfidence != null
                          ? `${c.averageMetadataConfidence}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
