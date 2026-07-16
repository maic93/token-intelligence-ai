import type { RiskFactor, RiskLevel } from './types.js';

export function calculateScore(factors: RiskFactor[]): number {
  const totalPenalty = factors.reduce((sum, f) => sum + f.penalty, 0);
  return Math.max(0, Math.min(100, totalPenalty));
}

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 20) return 'SAFE';
  if (score <= 40) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

export function generateExplanation(
  factors: RiskFactor[],
  score: number,
  level: RiskLevel,
): string {
  const failed = factors.filter((f) => !f.passed);
  if (failed.length === 0) {
    return 'All checks passed. Token appears safe.';
  }
  const reasons = failed.map((f) => f.reason);
  return `${reasons.join('. ')}. Score: ${score}/100 — ${level} risk.`;
}
