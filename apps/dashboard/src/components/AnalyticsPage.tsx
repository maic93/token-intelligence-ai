import { useState, useEffect } from 'react';
import type { AnalyticsReport } from '../types';
import { fetchAnalytics } from '../api';
import { shortAddress } from '../utils';

interface AnalyticsPageProps {
  chain: string;
  address: string;
  onBack: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="analytics-loading">
      <div className="skeleton-card">
        <div className="skeleton skeleton-line skeleton-line-lg" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  const display = value === null || value === undefined ? '—' : String(value);
  return (
    <div className="analytics-field">
      <span className="analytics-field-label">{label}</span>
      <span className="analytics-field-value">{display}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="analytics-section">
      <h3 className="analytics-section-title">{title}</h3>
      <div className="analytics-fields">{children}</div>
    </div>
  );
}

export function AnalyticsPage({ chain, address, onBack }: AnalyticsPageProps) {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError(null);
    fetchAnalytics(chain, address, abort.signal)
      .then((res) => {
        setReport(res.data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => abort.abort();
  }, [chain, address]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <button className="btn" onClick={onBack} type="button">
            Back
          </button>
          <h2 className="analytics-title">Analytics</h2>
        </div>
        <div className="error-banner">Failed to load analytics: {error}</div>
      </div>
    );
  }

  if (!report) return null;

  const t = report.tokenAnalytics;
  const l = report.liquidityAnalytics;
  const h = report.holderAnalytics;
  const tx = report.transactionAnalytics;
  const d = report.deployerAnalytics;
  const c = report.chainAnalytics;

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <button className="btn" onClick={onBack} type="button">
          Back
        </button>
        <h2 className="analytics-title">Analytics: {shortAddress(address)}</h2>
        <span className="chain-badge" data-chain={chain}>
          {chain}
        </span>
      </div>

      <div className="analytics-grid">
        <Section title="Token Overview">
          <Field
            label="Token Age"
            value={
              t.tokenAge !== null
                ? `${Math.floor(t.tokenAge / 3600)}h ${Math.floor((t.tokenAge % 3600) / 60)}m`
                : null
            }
          />
          <Field label="Chain" value={t.chain} />
          <Field label="Chain ID" value={t.chainId} />
          <Field label="Creation Block" value={t.creationBlock} />
          <Field label="Creator" value={t.creatorAddress ? shortAddress(t.creatorAddress) : null} />
          <Field label="Holder Count" value={t.holderCount} />
          <Field label="Total Supply" value={t.totalSupply} />
          <Field label="Decimals" value={t.decimals} />
          <Field label="Verified Source" value={t.verifiedSource} />
          <Field label="Contract Type" value={t.contractType} />
          <Field label="Is Proxy" value={t.isProxy} />
          <Field label="Is Mintable" value={t.isMintable} />
          <Field label="Is Pausable" value={t.isPausable} />
          <Field label="Ownership Renounced" value={t.ownershipRenounced} />
        </Section>

        <Section title="Holder Distribution">
          <Field
            label="Top Holder %"
            value={h.topHolderPercentage !== null ? `${h.topHolderPercentage}%` : null}
          />
          <Field label="Top 5 Holders" value={h.top5Holders} />
          <Field label="Top 10 Holders" value={h.top10Holders} />
          <Field label="Whale Concentration" value={h.whaleConcentration} />
          <Field label="Creator Balance" value={h.creatorBalance} />
          <Field label="Burn Address Balance" value={h.burnAddressBalance} />
          <Field label="Distribution Score" value={h.distributionScore} />
          <Field label="Holder Growth (24h)" value={h.holderGrowth24h} />
        </Section>

        <Section title="Liquidity">
          <Field label="Liquidity" value={l.liquidity} />
          <Field label="Liquidity Ratio" value={l.liquidityRatio} />
          <Field label="Est. Market Cap" value={l.estimatedMarketCap} />
          <Field label="FDV" value={l.fdv} />
          <Field label="Locked Liquidity" value={l.lockedLiquidity} />
          <Field label="DEX Count" value={l.dexCount} />
        </Section>

        <Section title="Transactions">
          <Field label="24h Transactions" value={tx.transactions24h} />
          <Field label="Unique Buyers (24h)" value={tx.uniqueBuyers24h} />
          <Field label="Unique Sellers (24h)" value={tx.uniqueSellers24h} />
          <Field label="Buy/Sell Ratio" value={tx.buySellRatio} />
          <Field label="Volume (24h)" value={tx.volume24h} />
          <Field label="Avg Tx Size" value={tx.averageTransactionSize} />
          <Field label="Largest Tx" value={tx.largestTransaction} />
        </Section>

        <Section title="Deployer">
          <Field label="Deployed Contracts" value={d.deployedContracts} />
          <Field label="Known Deployer" value={d.knownDeployer} />
          <Field label="Previous Rugs" value={d.previousRugs} />
          <Field
            label="Deployment Frequency"
            value={
              d.deploymentFrequency !== null ? `${d.deploymentFrequency.toFixed(2)}/day` : null
            }
          />
          <Field label="Wallet Age" value={d.walletAge} />
          <Field label="Previous Tokens" value={d.previousTokens ? d.previousTokens.length : 0} />
        </Section>

        <Section title="Chain Status">
          <Field label="Latest Indexed Block" value={c.latestIndexedBlock} />
          <Field label="Indexed Tokens" value={c.indexedTokens} />
          <Field label="RPC Health" value={c.rpcHealth} />
          <Field label="Sync Delay" value={c.syncDelay} />
          <Field label="Indexing Speed" value={c.indexingSpeed} />
        </Section>
      </div>

      <div className="analytics-footer">
        Generated at {new Date(report.generatedAt).toLocaleString()} | v{report.version}
      </div>
    </div>
  );
}
