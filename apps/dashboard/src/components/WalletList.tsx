import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Search, X, Shield, TrendingUp, Users, Star, AlertTriangle } from 'lucide-react';
import type { WalletProfileData } from '../types';
import { fetchWallets } from '../api';
import { shortAddress, timeAgo } from '../utils';
import { WalletDetail } from './WalletDetail';

function gradeColor(grade: string): string {
  switch (grade) {
    case 'Excellent':
      return '#4ade80';
    case 'Good':
      return '#a3e635';
    case 'Average':
      return '#eab308';
    case 'Poor':
      return '#fb923c';
    case 'Dangerous':
      return '#f87171';
    default:
      return '#9ca3af';
  }
}

function scoreColor(score: number | null): string {
  if (score === null) return 'var(--text-muted)';
  if (score <= 20) return '#4ade80';
  if (score <= 40) return '#a3e635';
  if (score <= 60) return '#facc15';
  if (score <= 80) return '#fb923c';
  return '#f87171';
}

function gradeBadge(grade: string): string {
  switch (grade) {
    case 'Excellent':
      return '\u{1F7E2}';
    case 'Good':
      return '\u{1F7E1}';
    case 'Average':
      return '\u{1F7E0}';
    case 'Poor':
      return '\u{1F7E0}';
    case 'Dangerous':
      return '\u{1F534}';
    default:
      return '\u26AA';
  }
}

const GRADE_OPTIONS = ['', 'Excellent', 'Good', 'Average', 'Poor', 'Dangerous'];
const LABEL_OPTIONS = [
  '',
  'NEW_DEPLOYER',
  'SERIAL_DEPLOYER',
  'B20_CREATOR',
  'HIGH_RISK_CREATOR',
  'TRUSTED_CREATOR',
  'SUSPICIOUS',
  'SPAMMER',
  'MEME_FACTORY',
  'UTILITY_BUILDER',
];
const SORT_OPTIONS = [
  { value: 'reputation_desc', label: 'Reputation (high)' },
  { value: 'reputation_asc', label: 'Reputation (low)' },
  { value: 'deployments_desc', label: 'Most Deployments' },
  { value: 'deployments_asc', label: 'Least Deployments' },
  { value: 'risk_desc', label: 'Highest Risk' },
  { value: 'risk_asc', label: 'Lowest Risk' },
  { value: 'lastSeen_desc', label: 'Last Active' },
  { value: 'lastSeen_asc', label: 'Least Recent' },
];

export function WalletList() {
  const [wallets, setWallets] = useState<WalletProfileData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [gradeFilter, setGradeFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [sort, setSort] = useState('reputation_desc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<WalletProfileData | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    trusted: 0,
    suspicious: 0,
    serial: 0,
    newToday: 0,
    avgRep: 0,
  });

  const loadWallets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWallets({
        page,
        limit,
        grade: gradeFilter || undefined,
        label: labelFilter || undefined,
        sort,
        search: search || undefined,
      });
      setWallets(res.data);
      setTotal(res.total);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [page, limit, gradeFilter, labelFilter, sort, search]);

  const loadStats = useCallback(async () => {
    try {
      const [all, trusted, suspicious, serial] = await Promise.all([
        fetchWallets({ limit: 1 }),
        fetchWallets({ limit: 1, grade: 'Excellent' }),
        fetchWallets({ limit: 1, label: 'SUSPICIOUS' }),
        fetchWallets({ limit: 1, label: 'SERIAL_DEPLOYER' }),
      ]);
      const avgRepRes = await fetchWallets({ limit: 10000 });
      const repSum = avgRepRes.data.reduce((s, w) => s + w.reputation, 0);
      const avgRep = avgRepRes.total > 0 ? Math.round(repSum / avgRepRes.total) : 0;
      setStats({
        total: all.total,
        trusted: trusted.total,
        suspicious: suspicious.total,
        serial: serial.total,
        newToday: 0,
        avgRep,
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);
  useEffect(() => {
    loadStats();
  }, []);

  const totalPages = Math.ceil(total / limit);

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function clearSearch() {
    setSearchInput('');
    setSearch('');
    setPage(1);
  }

  function handleLabelClick(label: string) {
    setLabelFilter(label);
    setPage(1);
  }

  return (
    <div className="b20-dashboard">
      <div className="b20-header">
        <h1>
          <Wallet size={24} /> Wallet Intelligence
        </h1>
        <p className="b20-subtitle">
          Creator profiling, wallet labels, reputation scores, and risk analysis.
        </p>
      </div>

      <div className="analytics-cards-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <Wallet size={16} />
            <span>Total Wallets</span>
          </div>
          <div className="stat-card-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <Shield size={16} />
            <span>Trusted Wallets</span>
          </div>
          <div className="stat-card-value" style={{ color: '#4ade80' }}>
            {stats.trusted}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <AlertTriangle size={16} />
            <span>Suspicious Wallets</span>
          </div>
          <div className="stat-card-value" style={{ color: '#f87171' }}>
            {stats.suspicious}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <Star size={16} />
            <span>Average Reputation</span>
          </div>
          <div className="stat-card-value" style={{ color: scoreColor(stats.avgRep) }}>
            {stats.avgRep}/100
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <TrendingUp size={16} />
            <span>Serial Deployers</span>
          </div>
          <div className="stat-card-value">{stats.serial}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <Users size={16} />
            <span>New Wallets Today</span>
          </div>
          <div className="stat-card-value">{stats.newToday}</div>
        </div>
      </div>

      <div className="b20-controls">
        <div className="search-box" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Search wallet address..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {searchInput && (
            <button className="b20-link" onClick={clearSearch}>
              <X size={14} />
            </button>
          )}
        </div>
        <button className="btn btn-primary" onClick={handleSearch}>
          Search
        </button>
        <select
          className="b20-select"
          value={gradeFilter}
          onChange={(e) => {
            setGradeFilter(e.target.value);
            setPage(1);
          }}
        >
          {GRADE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g || 'All Grades'}
            </option>
          ))}
        </select>
        <select
          className="b20-select"
          value={labelFilter}
          onChange={(e) => {
            setLabelFilter(e.target.value);
            setPage(1);
          }}
        >
          {LABEL_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l || 'All Labels'}
            </option>
          ))}
        </select>
        <select className="b20-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="b20-table-wrapper">
        <table className="b20-table">
          <thead>
            <tr>
              <th>Wallet</th>
              <th>Grade</th>
              <th>Reputation</th>
              <th>Deployments</th>
              <th>Avg Risk</th>
              <th>Labels</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="b20-loading">
                  Loading...
                </td>
              </tr>
            ) : wallets.length === 0 ? (
              <tr>
                <td colSpan={7} className="b20-loading">
                  No wallets found
                </td>
              </tr>
            ) : (
              wallets.map((w, i) => (
                <motion.tr
                  key={w.wallet}
                  className="b20-row"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedWallet(w)}
                >
                  <td className="b20-cell-address" title={w.wallet}>
                    {shortAddress(w.wallet)}
                  </td>
                  <td>
                    <span className="b20-confidence-badge" style={{ color: gradeColor(w.grade) }}>
                      {gradeBadge(w.grade)} {w.grade}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: scoreColor(w.reputation) }}>{w.reputation}/100</span>
                  </td>
                  <td>{w.totalDeployments}</td>
                  <td>
                    <span style={{ color: scoreColor(w.averageRisk) }}>
                      {w.averageRisk ?? 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {w.labels.slice(0, 3).map((l) => (
                        <span
                          key={l}
                          className="b20-confidence-badge"
                          style={{
                            fontSize: 10,
                            cursor: 'pointer',
                            background: 'var(--bg-secondary)',
                            padding: '1px 6px',
                            borderRadius: 4,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLabelClick(l);
                          }}
                        >
                          {l}
                        </span>
                      ))}
                      {w.labels.length > 3 && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          +{w.labels.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{w.lastSeen ? timeAgo(w.lastSeen) : 'N/A'}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="b20-pagination">
          <button
            className="btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Page {page} of {totalPages} ({total} total)
          </span>
          <button
            className="btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {selectedWallet && (
        <WalletDetail walletData={selectedWallet} onClose={() => setSelectedWallet(null)} />
      )}
    </div>
  );
}
