export type WalletGrade = 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Dangerous';

export type WalletLabel =
  | 'NEW_DEPLOYER'
  | 'SERIAL_DEPLOYER'
  | 'B20_CREATOR'
  | 'HIGH_RISK_CREATOR'
  | 'MEME_FACTORY'
  | 'AI_BUILDER'
  | 'NFT_CREATOR'
  | 'UTILITY_BUILDER'
  | 'TRUSTED_CREATOR'
  | 'SUSPICIOUS'
  | 'SPAMMER';

export interface WalletMetrics {
  totalDeployments: number;
  successfulTokens: number;
  highRiskTokens: number;
  b20Tokens: number;
  averageRisk: number | null;
  averageMetadataConfidence: number;
  averageAiConfidence: number;
  walletAgeDays: number | null;
  deploymentSpanDays: number;
}

export interface WalletAnalysis {
  wallet: string;
  walletAgeDays: number | null;
  firstSeen: string | null;
  lastSeen: string | null;
  totalDeployments: number;
  successfulTokens: number;
  highRiskTokens: number;
  b20Tokens: number;
  averageRisk: number;
  averageMetadataConfidence: number;
  averageAiConfidence: number;
  reputation: number;
  grade: WalletGrade;
  labels: WalletLabel[];
  summary: string;
}

export function analyzeWallet(
  wallet: string,
  metrics: WalletMetrics,
  firstSeen: Date | null,
  lastSeen: Date | null,
): WalletAnalysis {
  const reputation = calculateReputation(metrics);
  const grade = calculateGrade(reputation);
  const labels = generateLabels(metrics, grade);
  const summary = generateSummary(metrics, labels, grade);

  return {
    wallet: wallet.toLowerCase(),
    walletAgeDays: metrics.walletAgeDays,
    firstSeen: firstSeen?.toISOString() ?? null,
    lastSeen: lastSeen?.toISOString() ?? null,
    totalDeployments: metrics.totalDeployments,
    successfulTokens: metrics.successfulTokens,
    highRiskTokens: metrics.highRiskTokens,
    b20Tokens: metrics.b20Tokens,
    averageRisk: metrics.averageRisk ?? 0,
    averageMetadataConfidence: Math.round(metrics.averageMetadataConfidence),
    averageAiConfidence: Math.round(metrics.averageAiConfidence),
    reputation,
    grade,
    labels,
    summary,
  };
}

function calculateReputation(metrics: WalletMetrics): number {
  let score = 50;

  if (metrics.totalDeployments === 0) return 50;

  if (metrics.averageMetadataConfidence >= 90) score += 15;
  else if (metrics.averageMetadataConfidence >= 70) score += 8;
  else if (metrics.averageMetadataConfidence < 50) score -= 8;

  const successRate =
    metrics.totalDeployments > 0 ? metrics.successfulTokens / metrics.totalDeployments : 0;
  if (successRate >= 0.8 && metrics.totalDeployments >= 5) score += 15;
  else if (successRate >= 0.6 && metrics.totalDeployments >= 3) score += 8;

  const rugRate =
    metrics.totalDeployments > 0 ? metrics.highRiskTokens / metrics.totalDeployments : 0;
  if (rugRate > 0.5 && metrics.totalDeployments >= 3) score -= 15;
  else if (rugRate > 0.3 && metrics.totalDeployments >= 3) score -= 8;

  if (metrics.averageRisk !== null && metrics.totalDeployments > 0) {
    if (metrics.averageRisk <= 20) score += 10;
    else if (metrics.averageRisk <= 40) score += 5;
    else if (metrics.averageRisk >= 80) score -= 15;
    else if (metrics.averageRisk >= 60) score -= 8;
  }

  if (metrics.totalDeployments >= 10) score += 5;
  if (metrics.b20Tokens > 0) score -= 5;

  if (metrics.totalDeployments >= 5 && metrics.deploymentSpanDays < 1) score -= 15;
  else if (metrics.totalDeployments >= 3 && metrics.deploymentSpanDays < 0.5) score -= 10;
  if (metrics.totalDeployments >= 10 && metrics.deploymentSpanDays > 30) score += 10;

  if (metrics.averageAiConfidence >= 80) score += 5;
  else if (metrics.averageAiConfidence < 30 && metrics.totalDeployments >= 3) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateGrade(score: number): WalletGrade {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  if (score >= 20) return 'Poor';
  return 'Dangerous';
}

function generateLabels(metrics: WalletMetrics, grade: WalletGrade): WalletLabel[] {
  const labels: WalletLabel[] = [];

  if (metrics.totalDeployments === 0) return labels;

  if (metrics.totalDeployments === 1) labels.push('NEW_DEPLOYER');
  if (metrics.totalDeployments >= 10) labels.push('SERIAL_DEPLOYER');
  if (metrics.b20Tokens >= 3) labels.push('B20_CREATOR');
  if (metrics.highRiskTokens >= 3) labels.push('HIGH_RISK_CREATOR');
  if ((metrics.totalDeployments >= 5 && grade === 'Poor') || grade === 'Dangerous')
    labels.push('SPAMMER');
  if (metrics.highRiskTokens >= 5) labels.push('SUSPICIOUS');
  if (grade === 'Excellent' || grade === 'Good') {
    if (metrics.totalDeployments >= 3) labels.push('TRUSTED_CREATOR');
  }
  if (metrics.totalDeployments >= 5 && metrics.highRiskTokens === 0) labels.push('UTILITY_BUILDER');
  if (metrics.b20Tokens >= 1) labels.push('MEME_FACTORY');

  return labels;
}

function generateSummary(
  metrics: WalletMetrics,
  labels: WalletLabel[],
  grade: WalletGrade,
): string {
  const parts: string[] = [];

  if (metrics.totalDeployments === 1) {
    parts.push('First deployment.');
  } else {
    parts.push(`Serial deployer with ${metrics.totalDeployments} deployments.`);
  }

  if (metrics.walletAgeDays !== null) {
    if (metrics.walletAgeDays < 1) parts.push('Wallet is less than a day old.');
    else if (metrics.walletAgeDays < 7)
      parts.push(`First deployment seen ${Math.round(metrics.walletAgeDays)} day(s) ago.`);
    else parts.push(`Active for ${Math.round(metrics.walletAgeDays)} days.`);
  }

  if (metrics.highRiskTokens > 0) {
    const pct = Math.round((metrics.highRiskTokens / metrics.totalDeployments) * 100);
    if (pct >= 50) parts.push('Majority are high-risk.');
    else parts.push(`${metrics.highRiskTokens} high-risk token(s).`);
  }

  if (metrics.b20Tokens >= 3) parts.push('Mostly meme tokens.');
  else if (metrics.b20Tokens >= 1) parts.push(`${metrics.b20Tokens} B20 tokens.`);

  if (labels.includes('TRUSTED_CREATOR') || grade === 'Excellent')
    parts.push('Highly trusted creator.');
  if (labels.includes('SUSPICIOUS')) parts.push('Suspicious activity detected.');
  if (labels.includes('SPAMMER')) parts.push('Likely spam deployer.');
  if (labels.includes('UTILITY_BUILDER')) parts.push('Utility-focused builder.');

  if (metrics.averageRisk !== null) {
    const riskLabel =
      metrics.averageRisk <= 20
        ? 'Low'
        : metrics.averageRisk <= 40
          ? 'Moderate'
          : metrics.averageRisk <= 60
            ? 'Average'
            : metrics.averageRisk <= 80
              ? 'High'
              : 'Critical';
    parts.push(`Average risk ${riskLabel}.`);
  }

  const repLabel =
    grade === 'Excellent'
      ? 'Excellent'
      : grade === 'Good'
        ? 'Good'
        : grade === 'Average'
          ? 'Average'
          : grade === 'Poor'
            ? 'Poor'
            : 'Dangerous';
  parts.push(`Reputation ${repLabel}.`);

  return parts.join(' ');
}
