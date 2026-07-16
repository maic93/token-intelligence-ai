import { createLogger } from '@token-intelligence-ai/shared';
import { getChainConfig, type ChainName } from '@token-intelligence-ai/blockchain';
import { analyticsRepository } from './repository.js';
import type {
  TokenAnalytics,
  LiquidityAnalytics,
  HolderAnalytics,
  TransactionAnalytics,
  DeployerAnalytics,
  ChainAnalytics,
} from './types.js';

const log = createLogger('analytics:collectors');

export async function collectTokenAnalytics(
  chain: ChainName,
  address: string,
): Promise<TokenAnalytics> {
  const token = await analyticsRepository.getToken(chain, address);
  const chainCfg = getChainConfig(chain);

  if (!token) {
    log.warn('Token not found for analytics', { chain, address });
    return {
      tokenAge: null,
      chain,
      chainId: chainCfg.chainId,
      creationBlock: null,
      creationTimestamp: null,
      creatorAddress: null,
      holderCount: null,
      totalSupply: null,
      decimals: null,
      verifiedSource: null,
      contractType: null,
      isProxy: null,
      isMintable: null,
      isPausable: null,
      ownershipRenounced: null,
    };
  }

  const now = Date.now();
  const created = token.blockTimestamp.getTime();
  const tokenAge = Math.floor((now - created) / 1000);

  return {
    tokenAge,
    chain,
    chainId: chainCfg.chainId,
    creationBlock: token.blockNumber.toString(),
    creationTimestamp: token.blockTimestamp.toISOString(),
    creatorAddress: token.deployer,
    holderCount: null,
    totalSupply: token.totalSupply,
    decimals: token.decimals,
    verifiedSource: null,
    contractType: null,
    isProxy: null,
    isMintable: null,
    isPausable: null,
    ownershipRenounced: null,
  };
}

export async function collectLiquidityAnalytics(): Promise<LiquidityAnalytics> {
  return {
    liquidity: null,
    liquidityRatio: null,
    estimatedMarketCap: null,
    fdv: null,
    lockedLiquidity: null,
    dexCount: null,
  };
}

export async function collectHolderAnalytics(): Promise<HolderAnalytics> {
  return {
    topHolderPercentage: null,
    top5Holders: null,
    top10Holders: null,
    whaleConcentration: null,
    creatorBalance: null,
    burnAddressBalance: null,
    distributionScore: null,
    holderGrowth24h: null,
  };
}

export async function collectTransactionAnalytics(): Promise<TransactionAnalytics> {
  return {
    transactions24h: null,
    uniqueBuyers24h: null,
    uniqueSellers24h: null,
    buySellRatio: null,
    volume24h: null,
    averageTransactionSize: null,
    largestTransaction: null,
  };
}

export async function collectDeployerAnalytics(
  chain: ChainName,
  address: string,
): Promise<DeployerAnalytics> {
  const token = await analyticsRepository.getToken(chain, address);
  if (!token) {
    return {
      deployedContracts: null,
      previousTokens: null,
      knownDeployer: null,
      previousRugs: null,
      deploymentFrequency: null,
      walletAge: null,
    };
  }

  const contracts = await analyticsRepository.getDeployerContracts(token.deployer, address);
  const deployedContracts = contracts.length;

  let deploymentFrequency: number | null = null;
  if (contracts.length >= 2) {
    const newest = new Date(contracts[0].blockTimestamp).getTime();
    const oldest = new Date(contracts[contracts.length - 1].blockTimestamp).getTime();
    const span = (newest - oldest) / 1000;
    deploymentFrequency = span > 0 ? contracts.length / (span / 86400) : null;
  }

  return {
    deployedContracts,
    previousTokens: contracts.map((c) => c.contractAddress),
    knownDeployer: null,
    previousRugs: null,
    deploymentFrequency,
    walletAge: null,
  };
}

export async function collectChainAnalytics(chain: ChainName): Promise<ChainAnalytics> {
  const chainCfg = getChainConfig(chain);
  const cursor = await analyticsRepository.getCursor(chain);
  const indexedTokens = await analyticsRepository.getChainTokenCount(chain);

  let syncDelay: number | null = null;
  if (cursor) {
    syncDelay = 0;
  }

  return {
    latestIndexedBlock: cursor?.blockNumber.toString() ?? null,
    indexedTokens,
    rpcHealth: chainCfg.enabled ? 'healthy' : 'degraded',
    syncDelay,
    indexingSpeed: null,
  };
}
