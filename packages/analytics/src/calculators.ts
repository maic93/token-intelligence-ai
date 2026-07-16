import type { HolderAnalytics } from './types.js';

export function calculateDistributionScore(
  holderAnalytics: Partial<HolderAnalytics>,
): number | null {
  const { top10Holders, topHolderPercentage } = holderAnalytics;
  if (top10Holders === null || top10Holders === undefined) return null;
  if (top10Holders === 0) return 100;

  if (topHolderPercentage !== null && topHolderPercentage !== undefined) {
    return Math.round(Math.max(0, 100 - topHolderPercentage));
  }

  return null;
}
