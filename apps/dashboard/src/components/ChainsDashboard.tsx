import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Activity, Clock, Database, Radio, Users } from 'lucide-react';
import { fetchChains } from '../api';
import type { ChainInfo } from '../types';

function chainBadgeClass(chain: string): string {
  return `chain-badge-${chain}`;
}

function healthColor(status: string): string {
  switch (status) {
    case 'Healthy':
      return '#4ade80';
    case 'Slow':
      return '#eab308';
    case 'Behind':
      return '#fb923c';
    case 'Offline':
      return '#f87171';
    default:
      return '#9ca3af';
  }
}

export function ChainsDashboard() {
  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchChains();
        if (active) setChains(res.data.chains);
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

  const enabled = chains.filter((c) => c.enabled);
  const disabled = chains.filter((c) => !c.enabled);

  return (
    <div className="chains-dashboard">
      <div className="chains-header">
        <h1>
          <Activity size={24} /> Chains
        </h1>
        <p className="chains-subtitle">Multi-chain indexing status and analytics</p>
      </div>

      {loading ? (
        <div className="skeleton skeleton-line" />
      ) : (
        <>
          <div className="chains-stats">
            <div className="stat-card">
              <div className="stat-card-header">
                <Radio size={16} /> Total Chains
              </div>
              <div className="stat-card-value">{chains.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <Activity size={16} /> Enabled
              </div>
              <div className="stat-card-value" style={{ color: '#4ade80' }}>
                {enabled.length}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <Database size={16} /> Total Tokens
              </div>
              <div className="stat-card-value">{chains.reduce((s, c) => s + c.tokenCount, 0)}</div>
            </div>
          </div>

          <div className="chains-grid">
            {enabled.map((c, i) => (
              <motion.div
                key={c.name}
                className="chain-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="chain-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`chain-badge ${chainBadgeClass(c.name)}`}>
                      {c.displayName}
                    </span>
                    <span
                      className="chain-health-dot"
                      style={{
                        backgroundColor: healthColor('Healthy'),
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                      title="Healthy"
                    />
                  </div>
                  <span className="chain-card-id">ID: {c.chainId}</span>
                </div>

                <div className="chain-card-body">
                  <div className="chain-metric">
                    <Database size={14} />
                    <span>
                      Tokens: <strong>{c.tokenCount}</strong>
                    </span>
                  </div>
                  <div className="chain-metric">
                    <Clock size={14} />
                    <span>Last Block: {c.lastSyncedBlock ?? '-'}</span>
                  </div>
                  <div className="chain-metric">
                    <Users size={14} />
                    <span>Currency: {c.nativeCurrency.symbol}</span>
                  </div>
                </div>

                <div className="chain-card-footer">
                  <a
                    className="btn btn-sm"
                    href={`${c.explorerUrl}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={11} /> Explorer
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          {disabled.length > 0 && (
            <div className="chains-disabled">
              <h3>Disabled Chains</h3>
              <div className="chains-grid">
                {disabled.map((c, i) => (
                  <motion.div
                    key={c.name}
                    className="chain-card chain-card-disabled"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="chain-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`chain-badge ${chainBadgeClass(c.name)}`}>
                          {c.displayName}
                        </span>
                        <span
                          className="chain-health-dot"
                          style={{
                            backgroundColor: '#6b7280',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            display: 'inline-block',
                          }}
                          title="Disabled"
                        />
                      </div>
                      <span className="chain-card-id">ID: {c.chainId}</span>
                    </div>
                    <div className="chain-card-body">
                      <span className="chain-disabled-label">Not configured</span>
                    </div>
                    <div className="chain-card-footer">
                      <span className="chain-card-status">Disabled</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
