import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import type { ChainInfo } from '../types';
import { fetchChains } from '../api';

function chainBadgeClass(chain: string): string {
  return `chain-badge-${chain}`;
}

export function ChainPanel() {
  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchChains()
      .then((res) => {
        if (active) setChains(res.data.chains);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="chain-panel">
      <h2 className="watchlist-title">Indexed Chains</h2>
      {loading ? (
        <div className="skeleton skeleton-line" />
      ) : chains.length === 0 ? (
        <div className="empty-state" style={{ padding: 24 }}>
          No chains configured
        </div>
      ) : (
        <div className="chain-list">
          {chains.map((c, i) => (
            <motion.div
              key={c.name}
              className="chain-item"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="chain-item-header">
                <span className={`chain-badge ${chainBadgeClass(c.name)}`}>{c.displayName}</span>
                <div className="chain-item-status">
                  <span className={`status-dot ${c.rpcAvailable ? 'connected' : 'disconnected'}`} />
                  <span className="chain-id">ID: {c.chainId}</span>
                </div>
              </div>
              <div className="chain-item-details">
                <span>Tokens: {c.tokenCount}</span>
                <span>Block: {c.lastSyncedBlock ?? '-'}</span>
                <span>Currency: {c.nativeCurrency.symbol}</span>
              </div>
              <a
                className="btn btn-sm"
                href={`${c.explorerUrl}/address/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={11} /> Explorer
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
