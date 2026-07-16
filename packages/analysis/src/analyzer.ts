import type { Token } from '@token-intelligence-ai/database';
import type { RiskAnalysis } from './types.js';
import { calculateScore, generateExplanation, getRiskLevel } from './scoring.js';
import {
  evaluateDecimalsRange,
  evaluateFuturePlaceholder,
  evaluateMissingName,
  evaluateMissingSymbol,
  evaluateNewDeployment,
  evaluateSupplyExceeds,
  evaluateSupplyMissing,
  evaluateUnknownDeployer,
} from './rules.js';

export interface AnalyzerContext {
  currentBlockNumber: bigint;
  getDeployerCount: (deployer: string, chain: string) => Promise<number>;
}

export async function analyze(token: Token, ctx: AnalyzerContext): Promise<RiskAnalysis> {
  const factors = [
    evaluateMissingSymbol(token.symbol),
    evaluateMissingName(token.name),
    evaluateDecimalsRange(token.decimals),
    evaluateSupplyMissing(token.totalSupply),
    evaluateSupplyExceeds(token.totalSupply),
    evaluateNewDeployment(token.blockNumber, ctx.currentBlockNumber),
    await evaluateUnknownDeployer(token.deployer, token.chain, ctx.getDeployerCount),
    evaluateFuturePlaceholder(),
  ];

  const riskScore = calculateScore(factors);
  const riskLevel = getRiskLevel(riskScore);
  const explanation = generateExplanation(factors, riskScore, riskLevel);

  return {
    riskScore,
    riskLevel,
    explanation,
    factors,
    analyzedAt: new Date().toISOString(),
  };
}
