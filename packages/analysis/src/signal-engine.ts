export type SignalType =
  | 'BUY_SIGNAL'
  | 'WATCHLIST'
  | 'EARLY_ALPHA'
  | 'SMART_MONEY'
  | 'SAFE_DEPLOYER'
  | 'MOMENTUM'
  | 'HIGH_RISK'
  | 'RUG_WARNING'
  | 'FUNDING_WARNING'
  | 'NEW_DEPLOYER'
  | 'PROMISING_AI'
  | 'PROMISING_B20'
  | 'PROMISING_DEFI'
  | 'PROMISING_MEME';

export type OverallRating =
  'STRONG_BUY' | 'BUY' | 'WATCH' | 'NEUTRAL' | 'CAUTION' | 'HIGH_RISK' | 'AVOID' | 'RUG_RISK';

export interface SignalInput {
  tokenId: string;
  contractAddress: string;
  chain: string;
  name: string;
  symbol: string;
  deployer: string;
  riskScore: number;
  riskLevel: string;
  aiCategory: string;
  aiConfidence: number;
  aiRecommendation: string;
  metadataConfidence: number;
  isB20: boolean;
  deployerReputation: number;
  deployerGrade: string;
  discoveredAt: Date;
  smartMoneyScore: number | null;
  smartMoneyGrade: string | null;
  fundingSourceType: string;
  fundingSourceLabel: string;
  fundingAmount: string | null;
  timeToDeploymentMinutes: number | null;
  fundedBy: string | null;
  fundedByClusterSize: number | null;
  walletTotalDeployments: number;
  walletSuccessfulTokens: number;
  walletHighRiskTokens: number;
  walletAgeDays: number | null;
}

export interface SignalResult {
  signal: SignalType;
  rating: OverallRating;
  headline: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  reasons: string[];
  recommendation: string;
  opportunityScore: number;
  riskScore: number;
  confidence: number;
}

export class SignalEngine {
  generateTokenSignal(input: SignalInput): SignalResult {
    const opportunityScore = this.generateOpportunityScore(input);
    const riskScore = this.generateRiskScore(input);
    const confidence = this.generateConfidence(input, opportunityScore, riskScore);
    const rating = this.determineOverallRating(opportunityScore, riskScore, input);
    const signal = this.determineSignalType(rating, input);
    const strengths = this.generateStrengths(input);
    const weaknesses = this.generateWeaknesses(input);
    const reasons = this.generateReasons(input, strengths, weaknesses);
    const headline = this.generateHeadline(rating, input);
    const summary = this.generateSummary(input, strengths, weaknesses);
    const recommendation = this.generateRecommendation(rating, input);

    return {
      signal,
      rating,
      headline,
      summary,
      strengths,
      weaknesses,
      reasons,
      recommendation,
      opportunityScore,
      riskScore,
      confidence,
    };
  }

  generateWalletSignal(input: SignalInput): SignalResult {
    const opportunityScore = this.generateOpportunityScore(input);
    const riskScore = this.generateRiskScore(input);
    const confidence = this.generateConfidence(input, opportunityScore, riskScore);

    let rating: OverallRating;
    if (input.smartMoneyGrade === 'Elite' && riskScore < 30) rating = 'STRONG_BUY';
    else if (input.smartMoneyGrade === 'Professional' && riskScore < 40) rating = 'BUY';
    else if (input.smartMoneyGrade === 'Dangerous') rating = 'AVOID';
    else if (riskScore > 60) rating = 'HIGH_RISK';
    else if (opportunityScore > 50) rating = 'WATCH';
    else rating = 'NEUTRAL';

    const strengths = this.generateStrengths(input);
    const weaknesses = this.generateWeaknesses(input);
    const reasons = this.generateReasons(input, strengths, weaknesses);
    const headline = `${input.deployer.slice(0, 8)}... — ${rating}`;
    const summary = this.generateSummary(input, strengths, weaknesses);
    const recommendation = this.generateRecommendation(rating, input);

    return {
      signal:
        input.smartMoneyScore !== null && input.smartMoneyScore >= 70 ? 'SMART_MONEY' : 'WATCHLIST',
      rating,
      headline,
      summary,
      strengths,
      weaknesses,
      reasons,
      recommendation,
      opportunityScore,
      riskScore,
      confidence,
    };
  }

  generateFundingSignal(input: SignalInput): SignalResult {
    const funded = input.fundingSourceType;
    let rating: OverallRating;
    let signal: SignalType;

    if (funded === 'exchange') {
      rating = 'BUY';
      signal = 'SMART_MONEY';
    } else if (funded === 'bridge') {
      rating = 'WATCH';
      signal = 'WATCHLIST';
    } else if (input.fundedByClusterSize !== null && input.fundedByClusterSize >= 3) {
      rating = 'CAUTION';
      signal = 'FUNDING_WARNING';
    } else if (funded === 'eoa') {
      rating = 'NEUTRAL';
      signal = 'WATCHLIST';
    } else {
      rating = 'CAUTION';
      signal = 'FUNDING_WARNING';
    }

    const opportunityScore = this.generateOpportunityScore(input);
    const riskScore = this.generateRiskScore(input);
    const confidence = this.generateConfidence(input, opportunityScore, riskScore);
    const strengths = this.generateStrengths(input);
    const weaknesses = this.generateWeaknesses(input);
    const reasons = this.generateReasons(input, strengths, weaknesses);
    const headline = `Funding: ${input.fundingSourceLabel || 'Unknown'} — ${rating}`;
    const summary = `Wallet funded by ${input.fundingSourceLabel || 'unknown source'}.`;
    const recommendation = this.generateRecommendation(rating, input);

    return {
      signal,
      rating,
      headline,
      summary,
      strengths,
      weaknesses,
      reasons,
      recommendation,
      opportunityScore,
      riskScore,
      confidence,
    };
  }

  generateOpportunityScore(input: SignalInput): number {
    let score = 0;
    const maxScore = 100;

    if (input.smartMoneyScore !== null) {
      score += input.smartMoneyScore * 0.25;
    }

    score += input.aiConfidence * 0.15;

    score += input.metadataConfidence * 0.15;

    if (input.deployerReputation >= 80) score += 12;
    else if (input.deployerReputation >= 60) score += 6;

    if (input.fundingSourceType === 'exchange') score += 10;
    else if (input.fundingSourceType === 'bridge') score += 5;

    if (input.walletSuccessfulTokens > 0) {
      const rate =
        input.walletTotalDeployments > 0
          ? input.walletSuccessfulTokens / input.walletTotalDeployments
          : 0;
      score += rate * 10;
    }

    if (input.aiConfidence >= 80 && input.aiCategory !== 'UNKNOWN') score += 5;

    if (input.walletAgeDays !== null && input.walletAgeDays > 90) score += 5;
    else if (input.walletAgeDays !== null && input.walletAgeDays > 30) score += 3;

    score -= input.riskScore * 0.15;

    score = Math.max(0, Math.min(maxScore, Math.round(score)));
    return score;
  }

  generateRiskScore(input: SignalInput): number {
    let score = 0;
    const maxScore = 100;

    if (input.walletAgeDays !== null) {
      if (input.walletAgeDays < 1) score += 20;
      else if (input.walletAgeDays < 7) score += 10;
    }

    if (input.walletHighRiskTokens >= 5) score += 20;
    else if (input.walletHighRiskTokens >= 3) score += 12;
    else if (input.walletHighRiskTokens >= 1) score += 5;

    if (input.smartMoneyGrade === 'Dangerous') score += 20;
    else if (input.smartMoneyGrade === 'Speculative') score += 10;

    if (input.fundingSourceType === 'Unknown' || input.fundingSourceType === '') score += 12;

    if (input.fundedByClusterSize !== null && input.fundedByClusterSize >= 5) score += 12;

    if (input.timeToDeploymentMinutes !== null && input.timeToDeploymentMinutes < 60) score += 8;

    if (input.metadataConfidence < 50) score += 12;
    else if (input.metadataConfidence < 70) score += 6;

    if (input.aiCategory === 'UNKNOWN') score += 10;

    if (input.deployerReputation <= 20) score += 12;

    if (input.aiCategory === 'MEME' && input.isB20 && input.aiConfidence >= 60) score += 8;

    if (input.riskScore >= 80) score += 15;
    else if (input.riskScore >= 60) score += 10;
    else if (input.riskScore >= 40) score += 5;

    score = Math.max(0, Math.min(maxScore, Math.round(score)));
    return score;
  }

  generateConfidence(input: SignalInput, opportunityScore: number, riskScore: number): number {
    let confidence = 0;

    if (input.metadataConfidence >= 90) confidence += 20;
    else if (input.metadataConfidence >= 70) confidence += 10;

    if (input.aiConfidence >= 80) confidence += 20;
    else if (input.aiConfidence >= 50) confidence += 10;

    if (input.smartMoneyScore !== null && input.smartMoneyScore >= 70) confidence += 15;
    else if (input.smartMoneyScore !== null && input.smartMoneyScore >= 40) confidence += 8;

    if (input.fundingSourceType !== 'Unknown' && input.fundingSourceType !== '') confidence += 10;

    if (input.walletTotalDeployments > 0) confidence += 5;

    const spread = Math.abs(opportunityScore - riskScore);
    if (spread > 40) confidence += 10;
    else if (spread > 20) confidence += 5;

    if (input.deployerReputation >= 80) confidence += 10;
    else if (input.deployerReputation >= 60) confidence += 5;

    confidence = Math.max(0, Math.min(100, Math.round(confidence)));
    return confidence;
  }

  private determineOverallRating(
    opportunity: number,
    risk: number,
    input: SignalInput,
  ): OverallRating {
    const highRiskTokens = input.walletHighRiskTokens;

    if (risk >= 75 && highRiskTokens >= 3) return 'RUG_RISK';
    if (risk >= 65) return 'AVOID';
    if (risk >= 45) return 'HIGH_RISK';

    if (opportunity >= 75 && risk < 25) return 'STRONG_BUY';
    if (opportunity >= 50 && risk < 35) return 'BUY';
    if (opportunity >= 30 && risk < 40) return 'WATCH';

    if (risk > opportunity) return 'CAUTION';

    return 'NEUTRAL';
  }

  private determineSignalType(rating: OverallRating, input: SignalInput): SignalType {
    if (rating === 'RUG_RISK') return 'RUG_WARNING';
    if (rating === 'AVOID' || rating === 'HIGH_RISK') return 'HIGH_RISK';

    if (input.smartMoneyScore !== null && input.smartMoneyScore >= 70) return 'SMART_MONEY';
    if (input.smartMoneyScore !== null && input.smartMoneyScore >= 50) return 'SAFE_DEPLOYER';

    if (input.fundingSourceType === 'Unknown') return 'FUNDING_WARNING';

    const ageDays = input.walletAgeDays ?? 999;
    if (ageDays <= 7) return 'NEW_DEPLOYER';

    if (input.aiConfidence >= 80) {
      if (input.aiCategory === 'B20') return 'PROMISING_B20';
      if (input.aiCategory === 'DEFI') return 'PROMISING_DEFI';
      if (input.aiCategory === 'MEME') return 'PROMISING_MEME';
      if (input.aiCategory !== 'UNKNOWN') return 'PROMISING_AI';
    }

    if (rating === 'STRONG_BUY' || rating === 'BUY') return 'BUY_SIGNAL';
    if (rating === 'WATCH') return 'WATCHLIST';
    if (rating === 'CAUTION') return 'FUNDING_WARNING';

    return 'WATCHLIST';
  }

  private generateStrengths(input: SignalInput): string[] {
    const strengths: string[] = [];

    if (input.smartMoneyScore !== null && input.smartMoneyScore >= 70) {
      strengths.push(`Smart Money ${input.smartMoneyScore}`);
    }
    if (input.smartMoneyGrade === 'Elite' || input.smartMoneyGrade === 'Professional') {
      strengths.push(`${input.smartMoneyGrade} Wallet`);
    }
    if (input.metadataConfidence >= 90) strengths.push('Metadata 100');
    else if (input.metadataConfidence >= 70) strengths.push(`Metadata ${input.metadataConfidence}`);
    if (input.aiConfidence >= 80) strengths.push(`AI ${input.aiConfidence}`);
    if (input.fundingSourceType === 'exchange') {
      strengths.push(`Funded by ${input.fundingSourceLabel}`);
    }
    if (input.deployerReputation >= 80) strengths.push('Excellent Deployer Reputation');
    if (input.walletSuccessfulTokens > 0 && input.walletTotalDeployments > 0) {
      const rate = Math.round((input.walletSuccessfulTokens / input.walletTotalDeployments) * 100);
      if (rate >= 80) strengths.push(`${rate}% Success Rate`);
    }
    if (input.aiCategory !== 'UNKNOWN') strengths.push(`Category: ${input.aiCategory}`);
    if (input.riskScore < 30) strengths.push(`Low Risk Score ${input.riskScore}`);

    return strengths;
  }

  private generateWeaknesses(input: SignalInput): string[] {
    const weaknesses: string[] = [];

    if (input.walletAgeDays !== null) {
      if (input.walletAgeDays < 1) weaknesses.push('Wallet less than 1 day old');
      else if (input.walletAgeDays < 7)
        weaknesses.push(`Wallet only ${input.walletAgeDays} days old`);
    }
    if (input.walletHighRiskTokens >= 3) {
      weaknesses.push(`${input.walletHighRiskTokens} high-risk deployments`);
    }
    if (input.smartMoneyGrade === 'Dangerous') weaknesses.push('Dangerous Smart Money grade');
    if (input.fundingSourceType === 'Unknown' || input.fundingSourceType === '') {
      weaknesses.push('Unknown funding source');
    }
    if (input.fundedByClusterSize !== null && input.fundedByClusterSize >= 3) {
      weaknesses.push(`Part of a ${input.fundedByClusterSize}-wallet funding cluster`);
    }
    if (input.timeToDeploymentMinutes !== null && input.timeToDeploymentMinutes < 60) {
      weaknesses.push('Funded less than 1 hour before deployment');
    }
    if (input.metadataConfidence < 50) weaknesses.push('Low metadata confidence');
    else if (input.metadataConfidence < 70) weaknesses.push('Moderate metadata confidence');
    if (input.aiCategory === 'UNKNOWN') weaknesses.push('Unknown AI category');
    if (input.deployerReputation <= 20) weaknesses.push('Very low deployer reputation');
    if (input.riskScore >= 70) weaknesses.push(`High risk score ${input.riskScore}`);
    if (input.deployerGrade === 'Dangerous') weaknesses.push('Dangerous deployer grade');

    return weaknesses;
  }

  private generateReasons(input: SignalInput, strengths: string[], weaknesses: string[]): string[] {
    const reasons: string[] = [];

    for (const s of strengths) reasons.push(s);
    for (const w of weaknesses) reasons.push(w);

    return reasons;
  }

  private generateHeadline(rating: OverallRating, input: SignalInput): string {
    const label = rating.replace(/_/g, ' ');
    return `${input.name} (${input.symbol}) — ${label}`;
  }

  private generateSummary(input: SignalInput, strengths: string[], weaknesses: string[]): string {
    const parts: string[] = [];
    if (strengths.length > 0) parts.push(`Strengths: ${strengths.slice(0, 3).join(', ')}.`);
    if (weaknesses.length > 0) parts.push(`Weaknesses: ${weaknesses.slice(0, 3).join(', ')}.`);
    return parts.join(' ');
  }

  private generateRecommendation(rating: OverallRating, _input: SignalInput): string {
    // _input reserved for future use
    switch (rating) {
      case 'STRONG_BUY':
        return 'Strong buy candidate. Monitor closely for early accumulation.';
      case 'BUY':
        return 'Buy candidate with good fundamentals.';
      case 'WATCH':
        return 'Add to watchlist. Monitor for further signals.';
      case 'NEUTRAL':
        return 'Neutral. No strong signals either way.';
      case 'CAUTION':
        return 'Proceed with caution. Several risk factors present.';
      case 'HIGH_RISK':
        return 'High risk. Only for experienced traders.';
      case 'AVOID':
        return 'Avoid. Multiple red flags detected.';
      case 'RUG_RISK':
        return 'High probability of rug pull. Do not invest.';
    }
  }
}
