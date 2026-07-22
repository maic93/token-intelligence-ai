import { useEffect, useState } from 'react';
import { Activity, Globe, TrendingUp, Shield, Star, DollarSign, BarChart3 } from 'lucide-react';

interface CrossChainData {
  summary: {
    totalTokens: number;
    tokensToday: number;
    tokensThisWeek: number;
    totalChains: number;
    mostActiveChain: string | null;
    mostActiveChainCount: number;
  };
  chains: Array<{
    chain: string;
    tokenCount: number;
    avgMetadataConfidence: number;
    avgB20Confidence: number;
  }>;
  averages: {
    avgOpportunityScore: number;
    avgRiskScore: number;
    avgConfidence: number;
    avgSmartMoneyScore: number;
    averageFundingAmount: number;
  };
  smartMoney: {
    total: number;
    averageScore: number;
    eliteCount: number;
    professionalCount: number;
  };
  funding: {
    fundedCount: number;
    exchangeCount: number;
    bridgeCount: number;
  };
  dailyTrend: Array<{ date: string; tokensIndexed: number; uniqueDeployers: number }>;
}

export function CrossChainDashboard() {
  const [data, setData] = useState<CrossChainData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cross-chain-analytics')
      .then((r) => r.json())
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading cross-chain analytics...</div>;
  if (!data) return <div className="empty-state">No data available</div>;

  return (
    <div className="cross-chain-dashboard">
      <div className="section-header">
        <h1>
          <Globe size={24} /> Cross-Chain Analytics
        </h1>
        <p>Unified platform metrics across all chains</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Activity size={20} color="#4ade80" />
          <div>
            <strong>{data.summary.totalTokens}</strong>
            <span>Total Tokens</span>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={20} color="#60a5fa" />
          <div>
            <strong>{data.summary.tokensToday}</strong>
            <span>Today</span>
          </div>
        </div>
        <div className="stat-card">
          <BarChart3 size={20} color="#c084fc" />
          <div>
            <strong>{data.summary.tokensThisWeek}</strong>
            <span>This Week</span>
          </div>
        </div>
        <div className="stat-card">
          <Globe size={20} color="#fbbf24" />
          <div>
            <strong>{data.summary.totalChains}</strong>
            <span>Active Chains</span>
          </div>
        </div>
        <div className="stat-card">
          <Star size={20} color="#f472b6" />
          <div>
            <strong>{data.averages.avgSmartMoneyScore}</strong>
            <span>Avg Smart Money</span>
          </div>
        </div>
        <div className="stat-card">
          <Shield size={20} color="#fb923c" />
          <div>
            <strong>{data.averages.avgRiskScore}</strong>
            <span>Avg Risk</span>
          </div>
        </div>
      </div>

      {data.summary.mostActiveChain && (
        <div className="highlight-card">
          <h3>
            <Activity size={18} /> Most Active Chain
          </h3>
          <p>
            <strong>{data.summary.mostActiveChain}</strong> with{' '}
            <strong>{data.summary.mostActiveChainCount}</strong> tokens
          </p>
        </div>
      )}

      <div className="section">
        <h2>Chains Breakdown</h2>
        <div className="chain-breakdown-grid">
          {data.chains.map((c) => (
            <div key={c.chain} className="breakdown-card">
              <h3>{c.chain.charAt(0).toUpperCase() + c.chain.slice(1)}</h3>
              <div className="breakdown-metrics">
                <span>
                  Tokens: <strong>{c.tokenCount}</strong>
                </span>
                <span>
                  Metadata: <strong>{c.avgMetadataConfidence}%</strong>
                </span>
                <span>
                  B20: <strong>{c.avgB20Confidence}%</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Star size={20} color="#c084fc" />
          <div>
            <strong>{data.smartMoney.eliteCount + data.smartMoney.professionalCount}</strong>
            <span>Top Smart Money</span>
          </div>
        </div>
        <div className="stat-card">
          <DollarSign size={20} color="#4ade80" />
          <div>
            <strong>{data.funding.exchangeCount}</strong>
            <span>Exchange Funded</span>
          </div>
        </div>
        <div className="stat-card">
          <Shield size={20} color="#60a5fa" />
          <div>
            <strong>{data.funding.bridgeCount}</strong>
            <span>Bridge Funded</span>
          </div>
        </div>
      </div>
    </div>
  );
}
