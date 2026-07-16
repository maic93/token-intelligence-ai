export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'very_safe';

export interface RiskFactor {
  rule: string;
  passed: boolean;
  penalty: number;
  reason: string;
}

export interface RiskAnalysis {
  riskScore: number;
  riskLevel: RiskLevel;
  explanation: string;
  factors: RiskFactor[];
  analyzedAt: string;
}
