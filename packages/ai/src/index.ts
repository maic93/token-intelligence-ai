export interface RiskReport {
  score: number;
  summary: string;
}

export function createRiskReport(summary: string): RiskReport {
  return {
    score: 0,
    summary,
  };
}
