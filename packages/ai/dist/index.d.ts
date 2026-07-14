export interface RiskReport {
  score: number;
  summary: string;
}
export declare function createRiskReport(summary: string): RiskReport;
