import { useEffect, useState } from 'react';
import type { ChainInfo } from '../types';
import { fetchChains } from '../api';
import { explorerUrl } from '../utils';

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
      <h2 className="section-title">Indexed Chains</h2>
      {loading ? (
        <div className="skeleton skeleton-line" />
      ) : chains.length === 0 ? (
        <div className="empty-state-sm">No chains configured</div>
      ) : (
        <div className="chain-list">
          {chains.map((c) => (
            <div key={c.name} className="chain-item">
              <div className="chain-item-header">
                <span className={`chain-badge`} data-chain={c.name}>
                  {c.displayName}
                </span>
                <span className={`status-dot ${c.enabled ? 'connected' : 'disconnected'}`} />
              </div>
              <div className="chain-item-details">
                <span>Tokens: {c.tokenCount}</span>
                <span>Block: {c.lastSyncedBlock ?? '-'}</span>
              </div>
              <a
                className="btn btn-explorer btn-sm"
                href={explorerUrl(c.name, '')}
                target="_blank"
                rel="noopener noreferrer"
              >
                Explorer
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
