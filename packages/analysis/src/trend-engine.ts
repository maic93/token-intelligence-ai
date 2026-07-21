export type TrendPeriod = 'hourly' | 'daily' | 'weekly';

export interface TrendUpdateInput {
  chain: string;
  deployer: string;
  aiCategory: string;
  riskScore: number | null;
  riskLevel: string;
  metadataConfidence: number;
  aiConfidence: number;
  deployerReputation: number;
  discoveredAt: Date;
  isB20: boolean;
}

export interface TrendOverview {
  tokensToday: number;
  tokensThisHour: number;
  averageRisk: number | null;
  averageReputation: number | null;
  averageMetadata: number | null;
  averageAIConfidence: number | null;
}

export interface CategoryTrendData {
  category: string;
  tokens24h: number;
  tokens7d: number;
  growthPercent: number;
  averageRisk: number | null;
  averageConfidence: number | null;
}

export interface ChainTrendData {
  chain: string;
  tokensHour: number;
  tokensDay: number;
  averageDeployerReputation: number | null;
  averageRisk: number | null;
  averageMetadataQuality: number | null;
}

export interface DeployerTrendData {
  wallet: string;
  tokensIndexed: number;
  averageRisk: number | null;
  averageMetadataConfidence: number | null;
  averageAIConfidence: number | null;
  reputation: number;
}

export function getPeriodTimestamp(period: TrendPeriod, date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  if (period === 'hourly') {
    return d;
  }
  d.setUTCHours(0, 0, 0, 0);
  if (period === 'daily') {
    return d;
  }
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d;
}

export function computeTrendUpdate(input: TrendUpdateInput): {
  periods: TrendPeriod[];
  chain: string;
  category: string;
  deployer: string;
} {
  const periods: TrendPeriod[] = ['hourly', 'daily', 'weekly'];
  return { periods, chain: input.chain, category: input.aiCategory, deployer: input.deployer };
}

export function computeOverview(
  hourlyData: {
    tokensIndexed: number;
    averageRisk: number | null;
    averageMetadataConfidence: number | null;
    averageAIConfidence: number | null;
    uniqueDeployers: number;
  }[],
  dailyData: {
    tokensIndexed: number;
    averageRisk: number | null;
    averageMetadataConfidence: number | null;
    averageAIConfidence: number | null;
    uniqueDeployers: number;
  }[],
): TrendOverview {
  const hourSum = hourlyData.reduce((s, h) => s + h.tokensIndexed, 0);
  const daySum = dailyData.reduce((s, d) => s + d.tokensIndexed, 0);
  const riskValues = hourlyData.filter((h) => h.averageRisk !== null).map((h) => h.averageRisk!);
  const avgRisk =
    riskValues.length > 0
      ? Math.round(riskValues.reduce((a, b) => a + b, 0) / riskValues.length)
      : null;
  const metaValues = hourlyData
    .filter((h) => h.averageMetadataConfidence !== null)
    .map((h) => h.averageMetadataConfidence!);
  const avgMeta =
    metaValues.length > 0
      ? Math.round((metaValues.reduce((a, b) => a + b, 0) / metaValues.length) * 10) / 10
      : null;
  const aiValues = hourlyData
    .filter((h) => h.averageAIConfidence !== null)
    .map((h) => h.averageAIConfidence!);
  const avgAi =
    aiValues.length > 0
      ? Math.round((aiValues.reduce((a, b) => a + b, 0) / aiValues.length) * 10) / 10
      : null;

  return {
    tokensToday: daySum,
    tokensThisHour: hourSum,
    averageRisk: avgRisk,
    averageReputation: null,
    averageMetadata: avgMeta,
    averageAIConfidence: avgAi,
  };
}

export function computeCategoryGrowth(
  current: { tokensIndexed: number; averageRisk: number | null },
  previous: { tokensIndexed: number; averageRisk: number | null } | null,
): number {
  if (!previous || previous.tokensIndexed === 0) return current.tokensIndexed > 0 ? 100 : 0;
  return (
    Math.round(
      ((current.tokensIndexed - previous.tokensIndexed) / previous.tokensIndexed) * 100 * 100,
    ) / 100
  );
}
