import { useState, useEffect } from 'react';

const API_BASE = '/api/signals-v2';

interface TokenSignalProps {
  tokenId: string;
}

interface SignalData {
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

export function TokenSignal({ tokenId }: TokenSignalProps) {
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/${tokenId}`)
      .then((r) => r.json())
      .then((d) => {
        setSignal(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tokenId]);

  if (loading) return <div className="signal-loading">Loading signal...</div>;
  if (!signal) return null;

  const color = RATING_COLORS[signal.rating] || '#888';

  return (
    <div className="token-signal" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="signal-header">
        <span className="signal-badge" style={{ background: color }}>
          {signal.rating.replace(/_/g, ' ')}
        </span>
        <span className="signal-type">{signal.signal.replace(/_/g, ' ')}</span>
      </div>

      <div className="signal-scores">
        <div className="score-item">
          <strong>{signal.confidence}%</strong> Confidence
        </div>
        <div className="score-item">
          <strong>{signal.opportunityScore}</strong> Opportunity
        </div>
        <div className="score-item">
          <strong>{signal.riskScore}</strong> Risk
        </div>
      </div>

      {signal.strengths.length > 0 && (
        <div className="signal-detail-section">
          <h4>Strengths</h4>
          <ul>
            {signal.strengths.map((s, i) => (
              <li key={i} className="strength-item">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {signal.weaknesses.length > 0 && (
        <div className="signal-detail-section">
          <h4>Weaknesses</h4>
          <ul>
            {signal.weaknesses.map((w, i) => (
              <li key={i} className="weakness-item">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {signal.reasons.length > 0 && (
        <div className="signal-detail-section">
          <h4>Reasons</h4>
          <ul>
            {signal.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="signal-recommendation">{signal.recommendation}</div>
    </div>
  );
}
