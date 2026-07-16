import type { Token } from '@token-intelligence-ai/database';
import type { TokenAnalysisData, RpcProvider } from './types.js';
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
import {
  detectBlacklistFunction,
  detectMintable,
  detectOwnerRenounced,
  detectPausable,
  detectProxyContract,
  detectVerifiedSource,
  detectLiquidity,
  detectHolderDistribution,
  buildSecurityMetrics,
} from './detectors.js';

export interface AnalyzerContext {
  currentBlockNumber: bigint;
  rpc: RpcProvider;
  getDeployerCount: (deployer: string, chain: string) => Promise<number>;
}

export async function analyze(token: Token, ctx: AnalyzerContext): Promise<TokenAnalysisData> {
  const { rpc } = ctx;
  const address = token.contractAddress;

  const metadataFactors = [
    evaluateMissingSymbol(token.symbol),
    evaluateMissingName(token.name),
    evaluateDecimalsRange(token.decimals),
    evaluateSupplyMissing(token.totalSupply),
    evaluateSupplyExceeds(token.totalSupply),
    evaluateNewDeployment(token.blockNumber, ctx.currentBlockNumber),
    await evaluateUnknownDeployer(token.deployer, token.chain, ctx.getDeployerCount),
    evaluateFuturePlaceholder(),
  ];

  const [owner, mint, pause, blacklist, proxy, source, liq, holders] = await Promise.all([
    detectOwnerRenounced(rpc, address),
    detectMintable(rpc, address),
    detectPausable(rpc, address),
    detectBlacklistFunction(rpc, address),
    detectProxyContract(rpc, address),
    detectVerifiedSource(rpc, address),
    detectLiquidity(rpc, address),
    detectHolderDistribution(rpc, address),
  ]);

  const factors = [
    ...metadataFactors,
    owner,
    mint,
    pause,
    blacklist,
    proxy,
    source,
    liq.locked,
    liq.buyTax,
    liq.sellTax,
    holders.top10Percent,
    holders.top1Percent,
  ];

  const riskScore = calculateScore(factors);
  const riskLevel = getRiskLevel(riskScore);
  const explanation = generateExplanation(factors, riskScore, riskLevel);

  const metrics = buildSecurityMetrics({
    ownerRenounced: owner,
    mintable: mint,
    pausable: pause,
    blacklistFunction: blacklist,
    proxyContract: proxy,
    verifiedSource: source,
    liquidity: liq,
  });

  return {
    riskScore,
    riskLevel,
    explanation,
    factors,
    ...metrics,
    analyzedAt: new Date().toISOString(),
  };
}
