export type SmartMoneyGrade =
  'Elite' | 'Professional' | 'Experienced' | 'Average' | 'Speculative' | 'Dangerous';

export type SmartMoneyLabel =
  | 'Early Adopter'
  | 'Meme Specialist'
  | 'AI Specialist'
  | 'DeFi Specialist'
  | 'NFT Specialist'
  | 'B20 Specialist'
  | 'Multi-chain'
  | 'Builder'
  | 'Safe Creator'
  | 'High Risk'
  | 'Serial Launcher';

export interface SmartMoneyInput {
  wallet: string;
  tokensCreated: number;
  successfulTokens: number;
  failedTokens: number;
  highRiskTokens: number;
  averageRisk: number | null;
  averageMetadataConfidence: number;
  averageAIConfidence: number;
  reputation: number;
  walletAgeDays: number | null;
  deploymentSpanDays: number;
  b20Count: number;
  chains: string[];
  firstSeen: Date | null;
  lastSeen: Date | null;
}

export interface SmartMoneyResult {
  wallet: string;
  score: number;
  grade: SmartMoneyGrade;
  labels: SmartMoneyLabel[];
  summary: string;
  reasons: string[];
  winRate: number;
}

export function calculateSmartMoneyScore(
  input: SmartMoneyInput,
  graphClusterScore: number | null = null,
): SmartMoneyResult {
  let score = 0;
  const reasons: string[] = [];

  const positive = calculatePositiveSignals(input);
  score += positive.score;
  reasons.push(...positive.reasons);

  const negative = calculateNegativeSignals(input);
  score -= negative.score;
  reasons.push(...negative.reasons);

  if (graphClusterScore !== null) {
    if (graphClusterScore >= 70) {
      score += 10;
      reasons.push('strong wallet graph cluster');
    } else if (graphClusterScore >= 40) {
      score += 5;
      reasons.push('moderate wallet graph cluster');
    } else if (graphClusterScore >= 0) {
      score -= 5;
      reasons.push('weak wallet graph cluster signal');
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const grade = calculateGrade(score);
  const labels = generateLabels(input, score);
  const winRate = calculateWinRate(input);
  const summary = generateSummary(input, score, grade, labels, winRate);

  return {
    wallet: input.wallet.toLowerCase(),
    score,
    grade,
    labels,
    summary,
    reasons,
    winRate,
  };
}

function calculateWinRate(input: SmartMoneyInput): number {
  if (input.tokensCreated === 0) return 0;
  return Math.round((input.successfulTokens / input.tokensCreated) * 100 * 100) / 100;
}

function calculatePositiveSignals(input: SmartMoneyInput): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (input.reputation >= 80) {
    score += 15;
    reasons.push('high reputation');
  } else if (input.reputation >= 60) {
    score += 8;
    reasons.push('good reputation');
  }

  if (input.walletAgeDays !== null && input.walletAgeDays > 90) {
    score += 10;
    reasons.push('long activity history');
  } else if (input.walletAgeDays !== null && input.walletAgeDays > 30) {
    score += 5;
    reasons.push('established history');
  }

  const successRate = input.tokensCreated > 0 ? input.successfulTokens / input.tokensCreated : 0;
  if (successRate >= 0.8 && input.tokensCreated >= 5) {
    score += 15;
    reasons.push('many successful launches');
  } else if (successRate >= 0.6 && input.tokensCreated >= 3) {
    score += 8;
    reasons.push('mostly successful launches');
  }

  if (input.averageRisk !== null && input.averageRisk <= 20) {
    score += 10;
    reasons.push('consistently low risk');
  } else if (input.averageRisk !== null && input.averageRisk <= 40) {
    score += 5;
    reasons.push('mostly low risk');
  }

  if (input.averageMetadataConfidence >= 90) {
    score += 10;
    reasons.push('high metadata quality');
  } else if (input.averageMetadataConfidence >= 70) {
    score += 5;
    reasons.push('good metadata quality');
  }

  if (input.averageAIConfidence >= 80) {
    score += 5;
    reasons.push('high AI confidence');
  }

  if (input.tokensCreated >= 10 && input.deploymentSpanDays > 30) {
    score += 8;
    reasons.push('healthy deployment cadence');
  }

  if (input.chains.length >= 2) {
    score += 5;
    reasons.push('active on multiple chains');
  }

  if (input.tokensCreated >= 20) {
    score += 5;
    reasons.push('Prolific creator');
  }

  return { score, reasons };
}

function calculateNegativeSignals(input: SmartMoneyInput): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const rugRate = input.tokensCreated > 0 ? input.highRiskTokens / input.tokensCreated : 0;
  if (rugRate > 0.5 && input.tokensCreated >= 3) {
    score += 20;
    reasons.push('many rugs detected');
  } else if (rugRate > 0.3 && input.tokensCreated >= 3) {
    score += 10;
    reasons.push('several rug tokens');
  }

  const failRate = input.tokensCreated > 0 ? input.failedTokens / input.tokensCreated : 0;
  if (failRate > 0.5 && input.tokensCreated >= 3) {
    score += 10;
    reasons.push('high failure rate');
  }

  if (input.averageRisk !== null) {
    if (input.averageRisk >= 80) {
      score += 15;
      reasons.push('critically high average risk');
    } else if (input.averageRisk >= 60) {
      score += 8;
      reasons.push('above average risk');
    }
  }

  if (input.tokensCreated >= 5 && input.deploymentSpanDays < 1) {
    score += 15;
    reasons.push('suspiciously rapid deployments');
  } else if (input.tokensCreated >= 3 && input.deploymentSpanDays < 0.5) {
    score += 10;
    reasons.push('very rapid spam-like deployments');
  }

  if (input.walletAgeDays !== null && input.walletAgeDays < 1) {
    score += 10;
    reasons.push('very new wallet');
  } else if (input.walletAgeDays !== null && input.walletAgeDays < 7) {
    score += 5;
    reasons.push('new wallet');
  }

  if (input.b20Count >= 3 && input.tokensCreated >= 5) {
    const b20Rate = input.b20Count / input.tokensCreated;
    if (b20Rate > 0.5) {
      score += 10;
      reasons.push('mostly meme tokens');
    }
  }

  return { score, reasons };
}

export function calculateGrade(score: number): SmartMoneyGrade {
  if (score >= 90) return 'Elite';
  if (score >= 70) return 'Professional';
  if (score >= 50) return 'Experienced';
  if (score >= 30) return 'Average';
  if (score >= 15) return 'Speculative';
  return 'Dangerous';
}

function generateLabels(input: SmartMoneyInput, score: number): SmartMoneyLabel[] {
  const labels: SmartMoneyLabel[] = [];

  if (input.walletAgeDays !== null && input.walletAgeDays > 0 && input.walletAgeDays < 7) {
    labels.push('Early Adopter');
  }

  const successRate = input.tokensCreated > 0 ? input.successfulTokens / input.tokensCreated : 0;
  if (successRate >= 0.8 && input.tokensCreated >= 5 && score >= 70) {
    labels.push('Builder');
  }

  if (input.chains.length >= 2) labels.push('Multi-chain');

  if (input.averageRisk !== null && input.averageRisk <= 20 && input.tokensCreated >= 3) {
    labels.push('Safe Creator');
  }

  if (input.averageRisk !== null && input.averageRisk >= 60) {
    labels.push('High Risk');
  }

  if (input.tokensCreated >= 10) labels.push('Serial Launcher');

  if (input.b20Count >= 3) {
    const b20Rate = input.b20Count / input.tokensCreated;
    if (b20Rate > 0.5) labels.push('Meme Specialist');
  }

  return labels;
}

function generateSummary(
  input: SmartMoneyInput,
  score: number,
  grade: SmartMoneyGrade,
  labels: SmartMoneyLabel[],
  winRate: number,
): string {
  const parts: string[] = [];

  if (grade === 'Elite') parts.push('Top-tier smart money wallet.');
  else if (grade === 'Professional')
    parts.push('Professional-level wallet with strong track record.');
  else if (grade === 'Experienced') parts.push('Experienced wallet with moderate success rate.');
  else if (grade === 'Average') parts.push('Average wallet performance.');
  else if (grade === 'Speculative') parts.push('Speculative wallet with high variance.');
  else parts.push('High-risk wallet with poor track record.');

  parts.push(`Score ${score}/100.`);

  if (input.tokensCreated > 0) {
    parts.push(`Created ${input.tokensCreated} token(s).`);
    parts.push(`${Math.round(winRate)}% win rate.`);
  }

  if (input.chains.length > 0) {
    parts.push(`Active on ${input.chains.length} chain(s).`);
  }

  if (labels.length > 0) {
    parts.push(`Labels: ${labels.join(', ')}.`);
  }

  if (score >= 70) parts.push('Recommended for watchlist.');
  else if (score <= 15) parts.push('Avoid — high risk of loss.');

  return parts.join(' ');
}
