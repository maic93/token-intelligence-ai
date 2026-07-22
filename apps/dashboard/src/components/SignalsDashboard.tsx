import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Shield,
  Star,
  Activity,
  Zap,
  Eye,
  ThumbsUp,
  Filter,
  Search,
  TrendingUp,
  Layers,
} from 'lucide-react';

const API_BASE = '/api/signals-v2';

interface SignalItem {
  id: string;
  tokenId: string;
  signal: string;
  rating: string;
  headline: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  reasons: string[];
  recommendation: string;
  opportunityScore: number;
  riskScore: number;
  confidence: number;
  token: {
    chain: string;
    contractAddress: string;
    name: string;
    symbol: string;
    deployer: string;
  };
}

interface SignalStats {
  total: number;
  strongBuy: number;
  buy: number;
  watch: number;
  neutral: number;
  caution: number;
  highRisk: number;
  avoid: number;
  rugRisk: number;
  averageConfidence: number;
  averageOpportunityScore: number;
  averageRiskScore: number;
  highestOpportunity: { tokenId: string; score: number } | null;
  highestRisk: { tokenId: string; score: number } | null;
}

const RATING_COLORS: Record<string, string> = {
  STRONG_BUY: '#00ff88',
  BUY: '#44cc66',
  WATCH: '#ffaa00',
  NEUTRAL: '#888888',
  CAUTION: '#ff6600',
  HIGH_RISK: '#ff3300',
  AVOID: '#cc0000',
  RUG_RISK: '#ff0000',
};

interface Filters {
  rating: string;
  signal: string;
  chain: string;
  category: string;
  minConfidence: string;
  maxRisk: string;
  minOpportunity: string;
  search: string;
}

export function SignalsDashboard() {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    rating: '',
    signal: '',
    chain: '',
    category: '',
    minConfidence: '',
    maxRisk: '',
    minOpportunity: '',
    search: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        params.set('limit', '20');
        params.set('page', String(page));
        if (filters.rating) params.set('rating', filters.rating);
        if (filters.signal) params.set('signal', filters.signal);
        if (filters.chain) params.set('chain', filters.chain);
        if (filters.category) params.set('category', filters.category);
        if (filters.minConfidence) params.set('minConfidence', filters.minConfidence);
        if (filters.maxRisk) params.set('maxRisk', filters.maxRisk);
        if (filters.minOpportunity) params.set('minOpportunity', filters.minOpportunity);
        if (filters.search) params.set('search', filters.search);

        const [signalsRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}?${params}`).then((r) => r.json()),
          fetch(`${API_BASE}/statistics`).then((r) => r.json()),
        ]);
        setSignals(signalsRes.data ?? []);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to load signals', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filters, page]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  if (loading) return <div className="loading">Loading Unified Signal Engine...</div>;

  const ratings = [
    'STRONG_BUY',
    'BUY',
    'WATCH',
    'NEUTRAL',
    'CAUTION',
    'HIGH_RISK',
    'AVOID',
    'RUG_RISK',
  ];
  const signalTypes = [
    'BUY_SIGNAL',
    'WATCHLIST',
    'EARLY_ALPHA',
    'SMART_MONEY',
    'SAFE_DEPLOYER',
    'HIGH_RISK',
    'RUG_WARNING',
    'FUNDING_WARNING',
    'NEW_DEPLOYER',
    'PROMISING_AI',
    'PROMISING_B20',
    'PROMISING_DEFI',
    'PROMISING_MEME',
  ];
  const categories = ['MEME', 'AI', 'DEFI', 'B20', 'GAMING', 'NFT', 'UTILITY', 'UNKNOWN'];

  return (
    <div className="signals-dashboard">
      <div className="signals-header">
        <h1>
          <Zap size={24} /> Unified Signal Engine
        </h1>
        <p>Actionable, explainable trading signals</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <ThumbsUp size={20} color="#00ff88" />
            <div>
              <strong>{stats.strongBuy + stats.buy}</strong>
              <span>Buy Signals</span>
            </div>
          </div>
          <div className="stat-card">
            <Eye size={20} color="#ffaa00" />
            <div>
              <strong>{stats.watch}</strong>
              <span>Watchlist</span>
            </div>
          </div>
          <div className="stat-card">
            <AlertTriangle size={20} color="#ff0000" />
            <div>
              <strong>{stats.highRisk + stats.avoid + stats.rugRisk}</strong>
              <span>High Risk</span>
            </div>
          </div>
          <div className="stat-card">
            <Star size={20} color="#8888ff" />
            <div>
              <strong>{stats.averageConfidence}%</strong>
              <span>Avg Confidence</span>
            </div>
          </div>
          <div className="stat-card">
            <Activity size={20} color="#44cc66" />
            <div>
              <strong>{stats.averageOpportunityScore}</strong>
              <span>Avg Opportunity</span>
            </div>
          </div>
          <div className="stat-card">
            <Shield size={20} color="#ff6600" />
            <div>
              <strong>{stats.averageRiskScore}</strong>
              <span>Avg Risk</span>
            </div>
          </div>
        </div>
      )}

      <div className="advanced-filters">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search signals by headline or recommendation..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        <div className="filter-grid">
          <div className="filter-group">
            <label>
              <Filter size={14} /> Rating
            </label>
            <select value={filters.rating} onChange={(e) => updateFilter('rating', e.target.value)}>
              <option value="">All Ratings</option>
              {ratings.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>
              <Zap size={14} /> Signal Type
            </label>
            <select value={filters.signal} onChange={(e) => updateFilter('signal', e.target.value)}>
              <option value="">All Signals</option>
              {signalTypes.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>
              <Layers size={14} /> Chain
            </label>
            <input
              type="text"
              placeholder="e.g. base"
              value={filters.chain}
              onChange={(e) => updateFilter('chain', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>
              <TrendingUp size={14} /> Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>
              <Star size={14} /> Min Confidence
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={filters.minConfidence}
              onChange={(e) => updateFilter('minConfidence', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>
              <Shield size={14} /> Max Risk
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="100"
              value={filters.maxRisk}
              onChange={(e) => updateFilter('maxRisk', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>
              <Activity size={14} /> Min Opportunity
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={filters.minOpportunity}
              onChange={(e) => updateFilter('minOpportunity', e.target.value)}
            />
          </div>
        </div>

        <div className="quick-rating-filters">
          {ratings.map((r) => (
            <button
              key={r}
              className={`filter-btn ${filters.rating === r ? 'active' : ''}`}
              onClick={() => updateFilter('rating', filters.rating === r ? '' : r)}
              style={
                filters.rating === r
                  ? { borderColor: RATING_COLORS[r], background: RATING_COLORS[r] + '22' }
                  : {}
              }
            >
              {r.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Signals ({stats?.total ?? 0})</h2>
        <div className="signal-list">
          {signals.map((s) => (
            <div
              key={s.id}
              className="signal-card"
              style={{ borderLeft: `4px solid ${RATING_COLORS[s.rating] || '#888'}` }}
            >
              <div className="signal-card-header">
                <span className="signal-headline">{s.headline}</span>
                <span
                  className="signal-badge"
                  style={{ background: RATING_COLORS[s.rating] || '#888' }}
                >
                  {s.rating.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="signal-meta">
                <span>{s.token.chain}</span>
                <span>Signal: {s.signal.replace(/_/g, ' ')}</span>
                <span>Confidence: {s.confidence}%</span>
                <span>Opportunity: {s.opportunityScore}</span>
                <span>Risk: {s.riskScore}</span>
              </div>
              <div className="signal-summary">{s.summary}</div>
              {s.strengths.length > 0 && (
                <div className="signal-strengths">
                  {s.strengths.slice(0, 3).map((st, i) => (
                    <span key={i} className="strength-badge">
                      {st}
                    </span>
                  ))}
                </div>
              )}
              {s.weaknesses.length > 0 && (
                <div className="signal-weaknesses">
                  {s.weaknesses.slice(0, 2).map((w, i) => (
                    <span key={i} className="weakness-badge">
                      {w}
                    </span>
                  ))}
                </div>
              )}
              <div className="signal-recommendation">{s.recommendation}</div>
            </div>
          ))}
        </div>

        {stats && stats.total > 20 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {Math.ceil(stats.total / 20)}
            </span>
            <button
              disabled={page >= Math.ceil(stats.total / 20)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
