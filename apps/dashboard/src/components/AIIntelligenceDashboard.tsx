import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, Filter, RefreshCw } from 'lucide-react';
import type { IntelligenceTokenData } from '../types';
import { fetchIntelligence } from '../api';
import { shortAddress, timeAgo, explorerUrl } from '../utils';

const CATEGORIES = [
  '',
  'B20',
  'MEME',
  'AI',
  'DEFI',
  'GAMING',
  'NFT',
  'UTILITY',
  'UNKNOWN',
] as const;
const RECOMMENDATIONS = ['', 'SAFE', 'WATCH', 'CAUTION', 'AVOID'] as const;

function recColor(rec: string): string {
  switch (rec) {
    case 'SAFE':
      return '#4ade80';
    case 'WATCH':
      return '#60a5fa';
    case 'CAUTION':
      return '#facc15';
    case 'AVOID':
      return '#f87171';
    default:
      return '#9ca3af';
  }
}

function catColor(cat: string): string {
  switch (cat) {
    case 'B20':
      return '#f59e0b';
    case 'MEME':
      return '#ec4899';
    case 'AI':
      return '#8b5cf6';
    case 'DEFI':
      return '#06b6d4';
    case 'GAMING':
      return '#22c55e';
    case 'NFT':
      return '#f97316';
    case 'UTILITY':
      return '#64748b';
    default:
      return '#9ca3af';
  }
}

export function AIIntelligenceDashboard() {
  const [tokens, setTokens] = useState<IntelligenceTokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [aggregations, setAggregations] = useState<{
    categories: Record<string, number>;
    recommendations: Record<string, number>;
  }>({ categories: {}, recommendations: {} });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchIntelligence({
        category: category || undefined,
        recommendation: recommendation || undefined,
        limit: 100,
      });
      setTokens(res.data);
      setAggregations(res.aggregations);
    } catch (err) {
      console.error('Failed to load intelligence', err);
    } finally {
      setLoading(false);
    }
  }, [category, recommendation]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Brain size={28} />
          <h1>AI Token Intelligence</h1>
        </div>
        <button className="btn" onClick={load} type="button">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {CATEGORIES.filter(Boolean).map((cat) => (
          <div key={cat} className="stat-card" style={{ borderLeft: `3px solid ${catColor(cat)}` }}>
            <div className="stat-value" style={{ color: catColor(cat) }}>
              {aggregations.categories[cat] ?? 0}
            </div>
            <div className="stat-label">{cat}</div>
          </div>
        ))}
      </div>

      <div
        className="filters-bar"
        style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}
      >
        <Filter size={16} />
        <select
          className="form-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="form-select"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
        >
          <option value="">All Recommendations</option>
          {RECOMMENDATIONS.filter(Boolean).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {aggregations.recommendations && (
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {RECOMMENDATIONS.filter(Boolean).map((r) => (
              <span key={r} style={{ fontSize: 12, color: recColor(r) }}>
                {r}: {aggregations.recommendations[r] ?? 0}
              </span>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading intelligence...</div>
      ) : tokens.length === 0 ? (
        <div className="empty-state">
          No tokens analyzed yet. New tokens will appear here as they are discovered.
        </div>
      ) : (
        <div className="grid">
          {tokens.map((t) => (
            <motion.div
              key={t.id}
              className="token-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
            >
              <div className="token-card-header">
                <div className="token-logo-placeholder">{t.symbol[0]?.toUpperCase() || '?'}</div>
                <span className="token-symbol">{t.symbol}</span>
                <span className="chain-badge">{t.chain}</span>
              </div>
              <div className="token-name">{t.name}</div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    backgroundColor: catColor(t.aiCategory),
                  }}
                >
                  {t.aiCategory}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    backgroundColor: recColor(t.aiRecommendation),
                  }}
                >
                  {t.aiRecommendation}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {t.aiConfidence}% confidence
                </span>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                  lineHeight: 1.4,
                }}
              >
                {t.aiSummary}
              </div>

              <div className="token-details-grid">
                <div className="token-detail-item">
                  <span className="token-detail-label">Creator</span>
                  <span className="token-detail-value">
                    {shortAddress(t.deployerReputation > 0 ? `${t.deployerGrade}` : '')}
                  </span>
                </div>
                <div className="token-detail-item">
                  <span className="token-detail-label">Rep</span>
                  <span className="token-detail-value">{t.deployerReputation}/100</span>
                </div>
                <div className="token-detail-item">
                  <span className="token-detail-label">Discovered</span>
                  <span className="token-detail-value">{timeAgo(t.discoveredAt)}</span>
                </div>
              </div>

              <div className="token-card-actions">
                <a
                  className="btn"
                  href={explorerUrl(t.chain, t.contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explorer
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
