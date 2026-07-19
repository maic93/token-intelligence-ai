import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Shield, Zap, Clock, Copy, ExternalLink, Check, X } from 'lucide-react';
import type { B20TokenData, B20AnalyticsData } from '../types';
import { fetchB20Tokens } from '../api';
import { explorerUrl, shortAddress, timeAgo } from '../utils';

function b20Color(confidence: number): string {
  if (confidence >= 90) return '#4ade80';
  if (confidence >= 70) return '#eab308';
  return '#9ca3af';
}

function b20Badge(confidence: number): string {
  if (confidence >= 90) return '\u{1F7E2}';
  if (confidence >= 70) return '\u{1F7E1}';
  return '\u26AA';
}

function scoreColor(score: number | null): string {
  if (score === null) return 'var(--text-muted)';
  if (score <= 20) return '#4ade80';
  if (score <= 40) return '#a3e635';
  if (score <= 60) return '#facc15';
  if (score <= 80) return '#fb923c';
  return '#f87171';
}

const SORT_OPTIONS = [
  { value: 'confidence_desc', label: 'Highest Confidence' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'confidence_asc', label: 'Lowest Confidence' },
];

export function B20Dashboard() {
  const [tokens, setTokens] = useState<B20TokenData[]>([]);
  const [analytics, setAnalytics] = useState<B20AnalyticsData | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('confidence_desc');
  const [minConfidence, setMinConfidence] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<B20TokenData | null>(null);
  const [copiedAddress, setCopiedAddress] = useState('');

  const loadTokens = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await fetchB20Tokens({ page: p, limit: 20, sort, minConfidence });
        setTokens(res.data);
        setAnalytics(res.analytics);
      } catch {
        // ignore
      }
      setLoading(false);
    },
    [sort, minConfidence],
  );

  useEffect(() => {
    loadTokens(1);
    setPage(1);
  }, [loadTokens]);

  useEffect(() => {
    loadTokens(page);
  }, [page, loadTokens]);

  const filteredTokens = tokens
    .filter((t) => {
      const q = searchQuery.toLowerCase();
      if (q) {
        return (
          t.tokenName.toLowerCase().includes(q) ||
          t.tokenSymbol.toLowerCase().includes(q) ||
          t.contractAddress.toLowerCase().includes(q) ||
          t.deployer.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .filter((t) => {
      if (riskFilter) {
        return t.riskLevel?.toLowerCase() === riskFilter.toLowerCase();
      }
      return true;
    });

  function copyAddress(address: string) {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(''), 2000);
  }

  return (
    <div className="b20-dashboard">
      <div className="b20-header">
        <h1>
          <Shield size={24} /> B20 Intelligence
        </h1>
        <p className="b20-subtitle">
          Heuristic classifier &mdash; detects probable B20-related tokens. Not an official B20
          registry.
        </p>
      </div>

      {analytics && (
        <div className="analytics-cards-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <BarChart3 size={16} />
              <span>Detected B20</span>
            </div>
            <div className="stat-card-value">{analytics.totalB20Tokens}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <Zap size={16} />
              <span>Avg Confidence</span>
            </div>
            <div className="stat-card-value">{analytics.averageConfidence}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <Shield size={16} />
              <span>Highest Confidence</span>
            </div>
            <div className="stat-card-value">{analytics.highestConfidence}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <Clock size={16} />
              <span>Newest B20</span>
            </div>
            <div className="stat-card-value">
              {analytics.newestB20 ? timeAgo(analytics.newestB20.blockTimestamp) : 'N/A'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <BarChart3 size={16} />
              <span>Detected Today</span>
            </div>
            <div className="stat-card-value">{analytics.detectedToday}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <Zap size={16} />
              <span>Detected / Hour</span>
            </div>
            <div className="stat-card-value">{analytics.detectedHour}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <BarChart3 size={16} />
              <span>Top Creator</span>
            </div>
            <div className="stat-card-value">
              {analytics.topCreator ? (
                <span title={analytics.topCreator.deployer}>
                  {shortAddress(analytics.topCreator.deployer)}
                </span>
              ) : (
                'N/A'
              )}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <Shield size={16} />
              <span>Highest Risk</span>
            </div>
            <div className="stat-card-value">
              {analytics.highestRisk ? `${analytics.highestRisk.riskScore ?? '?'}/100` : 'N/A'}
            </div>
          </div>
        </div>
      )}

      <div className="b20-controls">
        <input
          className="search-input"
          type="text"
          placeholder="Search name, symbol, contract, creator..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={minConfidence ?? ''}
          onChange={(e) => setMinConfidence(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">All Confidence</option>
          <option value="90">90-100</option>
          <option value="70">70-89</option>
          <option value="30">30-69</option>
        </select>
        <select
          className="filter-select"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="">All Risk</option>
          <option value="safe">SAFE</option>
          <option value="low">LOW</option>
          <option value="medium">MEDIUM</option>
          <option value="high">HIGH</option>
          <option value="critical">CRITICAL</option>
        </select>
      </div>

      <div className="b20-table-wrapper">
        <table className="b20-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Symbol</th>
              <th>B20</th>
              <th>Risk</th>
              <th>Meta</th>
              <th>Block</th>
              <th>Age</th>
              <th>Deployer</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="b20-loading">
                  Loading...
                </td>
              </tr>
            ) : filteredTokens.length === 0 ? (
              <tr>
                <td colSpan={9} className="b20-loading">
                  No B20 tokens found
                </td>
              </tr>
            ) : (
              filteredTokens.map((token) => {
                const key = `${token.chain}:${token.contractAddress}`;
                return (
                  <motion.tr key={key} className="b20-row" onClick={() => setSelectedToken(token)}>
                    <td className="b20-cell-name">{token.tokenName || 'Unnamed'}</td>
                    <td>{token.tokenSymbol}</td>
                    <td>
                      <span
                        className="b20-confidence-badge"
                        style={{ color: b20Color(token.b20Confidence) }}
                        title={`B20 Confidence: ${token.b20Confidence}%`}
                      >
                        {b20Badge(token.b20Confidence)} {token.b20Confidence}%
                      </span>
                    </td>
                    <td>
                      {token.riskScore !== null && (
                        <span style={{ color: scoreColor(token.riskScore) }}>
                          {token.riskScore}
                        </span>
                      )}
                    </td>
                    <td>
                      <span title={`Metadata Confidence: ${token.metadataConfidence}%`}>
                        {token.metadataConfidence}%
                      </span>
                    </td>
                    <td>{token.blockNumber}</td>
                    <td>{timeAgo(token.blockTimestamp)}</td>
                    <td className="b20-cell-address" title={token.deployer}>
                      {shortAddress(token.deployer)}
                    </td>
                    <td className="b20-cell-links">
                      <a
                        href={explorerUrl(token.chain, token.contractAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="b20-link"
                        title="Basescan Contract"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                      </a>
                      <a
                        href={`${explorerUrl(token.chain, token.contractAddress).replace('/address/', '/tx/')}${token.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="b20-link"
                        title="Basescan Transaction"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                      </a>
                      <a
                        href={`${explorerUrl(token.chain, token.deployer)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="b20-link"
                        title="Creator Wallet"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                      </a>
                      <button
                        className="b20-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyAddress(token.contractAddress);
                        }}
                        title="Copy address"
                      >
                        {copiedAddress === token.contractAddress ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <button
          className="btn"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span className="page-indicator">Page {page}</span>
        <button className="btn" disabled={tokens.length < 20} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>

      {selectedToken && (
        <div className="modal-overlay" onClick={() => setSelectedToken(null)}>
          <div className="modal-content b20-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedToken.tokenName || 'Unnamed'}</h2>
              <button className="modal-close" onClick={() => setSelectedToken(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="b20-detail-grid">
                <div className="b20-detail-section">
                  <h3>Classification</h3>
                  <div className="b20-detail-row">
                    <span>B20 Status</span>
                    <span style={{ color: selectedToken.isB20 ? '#4ade80' : '#f87171' }}>
                      {selectedToken.isB20 ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="b20-detail-row">
                    <span>B20 Confidence</span>
                    <span>{selectedToken.b20Confidence}%</span>
                  </div>
                </div>
                <div className="b20-detail-section">
                  <h3>Risk</h3>
                  <div className="b20-detail-row">
                    <span>Score</span>
                    <span style={{ color: scoreColor(selectedToken.riskScore) }}>
                      {selectedToken.riskScore ?? 'N/A'}
                    </span>
                  </div>
                  <div className="b20-detail-row">
                    <span>Level</span>
                    <span>{selectedToken.riskLevel ?? 'N/A'}</span>
                  </div>
                </div>
                <div className="b20-detail-section">
                  <h3>Metadata</h3>
                  <div className="b20-detail-row">
                    <span>Name</span>
                    <span>{selectedToken.tokenName || 'Unnamed'}</span>
                  </div>
                  <div className="b20-detail-row">
                    <span>Symbol</span>
                    <span>{selectedToken.tokenSymbol}</span>
                  </div>
                  <div className="b20-detail-row">
                    <span>Decimals</span>
                    <span>{selectedToken.decimals}</span>
                  </div>
                  <div className="b20-detail-row">
                    <span>Supply</span>
                    <span>{shortAddress(selectedToken.totalSupply)}</span>
                  </div>
                  <div className="b20-detail-row">
                    <span>Meta Confidence</span>
                    <span>{selectedToken.metadataConfidence}%</span>
                  </div>
                </div>
              </div>
              <div className="b20-detail-links">
                <a
                  href={explorerUrl(selectedToken.chain, selectedToken.contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  <ExternalLink size={14} /> Basescan Contract
                </a>
                <a
                  href={`${explorerUrl(selectedToken.chain, selectedToken.contractAddress).replace('/address/', '/tx/')}${selectedToken.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  <ExternalLink size={14} /> Basescan Transaction
                </a>
                <a
                  href={`${explorerUrl(selectedToken.chain, selectedToken.deployer)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  <ExternalLink size={14} /> Creator Wallet
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
