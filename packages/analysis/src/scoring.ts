import type { RiskFactor, RiskLevel } from './types.js';

export function calculateScore(factors: RiskFactor[]): number {
  const totalPenalty = factors.reduce((sum, f) => sum + f.penalty, 0);
  const score = 100 - totalPenalty;
  return Math.max(0, Math.min(100, score));
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 90) return 'very_safe';
  if (score >= 70) return 'low';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'high';
  return 'critical';
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
  return `${reasons.join('. ')}. Score: ${score}/100 — ${level.replace('_', ' ')} risk.`;
}
