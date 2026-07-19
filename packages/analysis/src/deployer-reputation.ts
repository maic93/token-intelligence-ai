export type ReputationGrade = 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Dangerous';

export interface DeployerMetrics {
  totalTokens: number;
  lowRiskTokens: number;
  mediumRiskTokens: number;
  highRiskTokens: number;
  avgRiskScore: number | null;
  avgMetadataConfidence: number;
  avgB20Confidence: number;
  uniqueNames: number;
  uniqueSymbols: number;
  duplicateNames: number;
  duplicateSymbols: number;
  deploymentSpanDays: number;
}

export interface DeployerReputation {
  score: number;
  grade: ReputationGrade;
  reasons: string[];
}

export function calculateDeployerReputation(metrics: DeployerMetrics): DeployerReputation {
  let score = 50;
  const reasons: string[] = [];

  if (metrics.avgMetadataConfidence >= 90) {
    score += 15;
    reasons.push('high metadata confidence');
  } else if (metrics.avgMetadataConfidence >= 70) {
    score += 8;
    reasons.push('good metadata confidence');
  } else if (metrics.avgMetadataConfidence < 50) {
    score -= 8;
    reasons.push('low metadata confidence');
  }

  if (metrics.totalTokens > 0) {
    const successRate = metrics.lowRiskTokens / metrics.totalTokens;
    if (successRate >= 0.8 && metrics.totalTokens >= 5) {
      score += 15;
      reasons.push('many successful low-risk tokens');
    } else if (successRate >= 0.6 && metrics.totalTokens >= 3) {
      score += 8;
      reasons.push('mostly successful tokens');
    }

    const rugRate = metrics.highRiskTokens / metrics.totalTokens;
    if (rugRate > 0.5 && metrics.totalTokens >= 3) {
      score -= 15;
      reasons.push('majority of tokens are high-risk');
    } else if (rugRate > 0.3 && metrics.totalTokens >= 3) {
      score -= 8;
      reasons.push('many high-risk tokens');
    }
  }

  if (metrics.avgRiskScore !== null && metrics.totalTokens > 0) {
    if (metrics.avgRiskScore <= 20) {
      score += 10;
      reasons.push('consistently low risk scores');
    } else if (metrics.avgRiskScore <= 40) {
      score += 5;
      reasons.push('mostly low risk scores');
    } else if (metrics.avgRiskScore >= 80) {
      score -= 15;
      reasons.push('consistently high risk scores');
    } else if (metrics.avgRiskScore >= 60) {
      score -= 8;
      reasons.push('above average risk scores');
    }
  }

  if (metrics.totalTokens > 1) {
    const nameVariety = metrics.uniqueNames / metrics.totalTokens;
    if (nameVariety >= 0.7) {
      score += 5;
      reasons.push('diverse token names');
    } else if (nameVariety < 0.3 && metrics.duplicateNames > 0) {
      score -= 5;
      reasons.push('many duplicate token names');
    }

    const symbolVariety = metrics.uniqueSymbols / metrics.totalTokens;
    if (symbolVariety >= 0.8) {
      score += 5;
      reasons.push('diverse token symbols');
    } else if (symbolVariety < 0.3 && metrics.duplicateSymbols > 0) {
      score -= 5;
      reasons.push('many duplicate token symbols');
    }
  }

  if (metrics.totalTokens >= 5 && metrics.deploymentSpanDays < 1) {
    score -= 15;
    reasons.push('suspiciously rapid deployments');
  } else if (metrics.totalTokens >= 3 && metrics.deploymentSpanDays < 0.5) {
    score -= 10;
    reasons.push('very rapid deployments');
  }

  if (metrics.totalTokens >= 10 && metrics.deploymentSpanDays > 30) {
    score += 10;
    reasons.push('established deployer with long history');
  }

  score = Math.max(0, Math.min(100, score));

  score = Math.round(score);

  let grade: ReputationGrade;
  if (score >= 80) grade = 'Excellent';
  else if (score >= 60) grade = 'Good';
  else if (score >= 40) grade = 'Average';
  else if (score >= 20) grade = 'Poor';
  else grade = 'Dangerous';

  return { score, grade, reasons };
}
