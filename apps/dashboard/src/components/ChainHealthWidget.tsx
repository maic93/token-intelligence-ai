import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, XCircle, Clock, Database, AlertTriangle } from 'lucide-react';

interface ChainHealthEntry {
  name: string;
  chainId: number;
  displayName: string;
  enabled: boolean;
  connected: boolean;
  logo: string;
  color: string;
  currentBlock: string | null;
  lastIndexedBlock: string | null;
  blocksBehind: number | null;
  tokenCount: number;
  workerStatus: string;
  errors: string[];
}

export function ChainHealthWidget() {
  const [chains, setChains] = useState<ChainHealthEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/chains/status').then((r) => r.json());
        if (active) setChains(res.data.chains ?? []);
      } catch {
        /* ignore */
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

  if (loading) return <div className="skeleton skeleton-line" />;

  const healthy = chains.filter((c) => c.enabled && c.connected);
  const issues = chains.filter((c) => c.enabled && (!c.connected || (c.blocksBehind ?? 0) > 100));

  return (
    <div className="chain-health-widget">
      <div className="chain-health-stats">
        <div className="stat-card">
          <div className="stat-card-header">
            <Activity size={14} /> Status
          </div>
          <div
            className="stat-card-value"
            style={{ color: issues.length === 0 ? '#4ade80' : '#f87171' }}
          >
            {issues.length === 0 ? 'All Healthy' : `${issues.length} Issue(s)`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <CheckCircle size={14} /> Active
          </div>
          <div className="stat-card-value" style={{ color: '#4ade80' }}>
            {healthy.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <Database size={14} /> Total Tokens
          </div>
          <div className="stat-card-value">{chains.reduce((s, c) => s + c.tokenCount, 0)}</div>
        </div>
      </div>

      <div className="chain-health-grid">
        {chains.map((c, i) => (
          <motion.div
            key={c.name}
            className="health-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="health-card-header">
              <span style={{ fontSize: 20 }}>{c.logo}</span>
              <span className="health-chain-name">{c.displayName}</span>
              {c.connected ? (
                <CheckCircle size={16} color="#4ade80" />
              ) : (
                <XCircle size={16} color="#f87171" />
              )}
            </div>
            <div className="health-card-body">
              <div className="health-metric">
                <Clock size={12} />
                <span>Last Block: {c.lastIndexedBlock ?? '-'}</span>
              </div>
              <div className="health-metric">
                <Database size={12} />
                <span>Tokens: {c.tokenCount}</span>
              </div>
              {c.blocksBehind !== null && c.blocksBehind > 0 && (
                <div
                  className="health-metric"
                  style={{ color: c.blocksBehind > 100 ? '#f87171' : '#eab308' }}
                >
                  <AlertTriangle size={12} />
                  <span>{c.blocksBehind} blocks behind</span>
                </div>
              )}
              {c.errors.length > 0 && (
                <div className="health-errors">
                  {c.errors.slice(0, 3).map((e, j) => (
                    <div key={j} className="health-error">
                      {e}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="health-card-footer">
              <span className={`health-status-badge ${c.connected ? 'connected' : 'disconnected'}`}>
                {c.workerStatus}
              </span>
              {c.connected && <span className="health-chain-id">Chain ID: {c.chainId}</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
