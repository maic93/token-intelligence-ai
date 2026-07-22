import { useState, useEffect } from 'react';

interface WalletSignalProps {
  wallet: string;
}

export function WalletSignal({ wallet }: WalletSignalProps) {
  const [smartMoney, setSmartMoney] = useState<{
    score: number;
    grade: string;
    winRate: number;
    tokensCreated: number;
    successfulTokens: number;
    labels: string[];
    summary: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const smRes = await fetch(`/api/smart-money/${wallet}`).then((r) => r.json());
        setSmartMoney(smRes.data ?? null);
      } catch {
        /* ignore */
      }
      setLoading(false);
    }
    load();
  }, [wallet]);

  if (loading) return <div className="signal-loading">Loading wallet signal...</div>;

  return (
    <div className="wallet-signal">
      {smartMoney && (
        <div className="signal-section">
          <h3>Smart Money Profile</h3>
          <div className="signal-scores">
            <div className="score-item">
              <span
                className="signal-badge"
                style={{
                  background:
                    smartMoney.grade === 'Elite'
                      ? '#00ff88'
                      : smartMoney.grade === 'Professional'
                        ? '#44cc66'
                        : smartMoney.grade === 'Dangerous'
                          ? '#ff0000'
                          : '#ffaa00',
                }}
              >
                {smartMoney.grade}
              </span>
              <strong>{smartMoney.score}/100</strong>
            </div>
            <div className="score-item">
              <strong>{smartMoney.winRate}%</strong> Win Rate
            </div>
            <div className="score-item">
              <strong>{smartMoney.tokensCreated}</strong> Tokens
            </div>
            <div className="score-item">
              <strong>{smartMoney.successfulTokens}</strong> Successful
            </div>
          </div>
          {smartMoney.labels.length > 0 && (
            <div className="signal-labels">
              {smartMoney.labels.map((l) => (
                <span key={l} className="label-badge">
                  {l}
                </span>
              ))}
            </div>
          )}
          <p className="signal-summary">{smartMoney.summary}</p>
        </div>
      )}
      {!smartMoney && (
        <div className="signal-section">
          <p className="signal-empty">No smart money data available for this wallet.</p>
        </div>
      )}
    </div>
  );
}
