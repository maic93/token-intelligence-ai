import {
  AnalysisRepository,
  TokenRepository,
  WalletRepository,
  TrendRepository,
  SmartMoneyRepository,
  FundingRepository,
  SignalRepository,
} from '@token-intelligence-ai/database';
import type { Logger } from '@token-intelligence-ai/shared';
import type { ChainConfig } from '@token-intelligence-ai/blockchain';
import {
  analyze,
  classifyB20,
  calculateDeployerReputation,
  analyzeToken,
  analyzeWallet,
  calculateSmartMoneyScore,
  analyzeFunding,
  buildFundingGraph,
  SignalEngine,
} from '@token-intelligence-ai/analysis';

import type { RpcClient, RpcTransaction } from './rpc.js';
import { detectErc20 } from './erc20.js';
import { validateTokenMetadata } from './erc20-validator.js';
import { publishWatchEvent } from './watch-publisher.js';

const SHORT_INPUT_LENGTH = 10;

export class BlockProcessor {
  constructor(
    private readonly chain: ChainConfig,
    private readonly rpc: RpcClient,
    private readonly tokenRepo: TokenRepository,
    private readonly analysisRepo: AnalysisRepository,
    private readonly walletRepo: WalletRepository,
    private readonly trendRepo: TrendRepository,
    private readonly smartMoneyRepo: SmartMoneyRepository,
    private readonly fundingRepo: FundingRepository,
    private readonly signalRepo: SignalRepository,
    private readonly log: Logger,
  ) {}

  private canCreateContract(tx: RpcTransaction): boolean {
    if (tx.to === null) return true;
    if (tx.input.length > SHORT_INPUT_LENGTH) return false;
    return true;
  }

  async processBlock(blockNumber: bigint): Promise<void> {
    const block = await this.rpc.getBlock(blockNumber);
    const blockTimestamp = new Date(parseInt(block.timestamp, 16) * 1000);

    const deployable = block.transactions.filter((tx) => this.canCreateContract(tx));
    this.log.info('Block processed', {
      chain: this.chain.name,
      block: blockNumber.toString(),
      txs: block.transactions.length,
      deployable: deployable.length,
    });
    if (deployable.length === 0) {
      await this.tokenRepo.saveLastProcessedBlock(this.chain.name, blockNumber);
      return;
    }

    const receipts = await this.rpc.getTransactionReceipts(deployable.map((tx) => tx.hash));
    const withContract = receipts.filter((r) => r && r.contractAddress).length;
    this.log.info('STAGE:receipts', {
      chain: this.chain.name,
      block: blockNumber.toString(),
      total: deployable.length,
      receipts: receipts.filter(Boolean).length,
      withContractAddress: withContract,
    });

    for (let i = 0; i < deployable.length; i++) {
      const tx = deployable[i];
      const receipt = receipts[i];

      if (!receipt) continue;
      if (!receipt.contractAddress) continue;
      if (receipt.status !== '0x1') continue;

      try {
        await this.processContractDeployment(tx, receipt, blockNumber, blockTimestamp);
      } catch (error) {
        this.log.error('Failed to process contract deployment', {
          chain: this.chain.name,
          txHash: tx.hash,
          contractAddress: receipt.contractAddress,
          blockNumber: blockNumber.toString(),
          error: String(error),
        });
      }
    }

    await this.tokenRepo.saveLastProcessedBlock(this.chain.name, blockNumber);
  }

  private async processContractDeployment(
    tx: RpcTransaction,
    receipt: { contractAddress: string | null; status: string; transactionHash: string },
    blockNumber: bigint,
    blockTimestamp: Date,
  ): Promise<void> {
    const contractAddress = receipt.contractAddress!.toLowerCase();
    this.log.info('STAGE:candidate', {
      chain: this.chain.name,
      contract: contractAddress,
      txHash: tx.hash,
      block: blockNumber.toString(),
    });
    const exists = await this.tokenRepo.tokenExists(this.chain.name, contractAddress);
    if (exists) {
      this.log.info('STAGE:exists true, skipping', { contract: contractAddress });
      return;
    }

    const result = await detectErc20(this.rpc, contractAddress);
    if (!result.metadata) {
      this.log.info('STAGE:erc20 failed', {
        contract: contractAddress,
        reason: result.reason || 'not ERC20',
      });
      return;
    }
    this.log.info('STAGE:metadata loaded', {
      contract: contractAddress,
      name: result.metadata.name,
      symbol: result.metadata.symbol,
      confidence: result.metadataConfidence,
    });

    const validation = validateTokenMetadata(result.metadata);
    if (!validation.valid) {
      this.log.info('STAGE:validator rejected', {
        contract: contractAddress,
        reason: validation.reason,
      });
      return;
    }
    this.log.info('STAGE:validator passed', { contract: contractAddress });

    const metadataConfidence = result.metadataConfidence;

    const b20Classification = classifyB20({
      name: result.metadata.name,
      symbol: result.metadata.symbol,
      deployer: tx.from.toLowerCase(),
      metadataConfidence,
      blockTimestamp,
      getDeployerB20Count: async () => this.tokenRepo.getDeployerB20Count(tx.from.toLowerCase()),
    });

    const deployer = tx.from.toLowerCase();

    const existingTokens = await this.tokenRepo.getTokensByDeployer(deployer);
    const allTokens = existingTokens.length;
    const existingLow = 0;
    const existingMedium = 0;
    const existingHigh = 0;
    const existingTotalRisk = 0;
    const existingRiskCount = 0;
    const existingNames = new Set<string>();
    const existingSymbols = new Set<string>();
    const existingNameCount = new Map<string, number>();
    const existingSymCount = new Map<string, number>();

    for (const t of existingTokens) {
      existingNames.add(t.name.toLowerCase());
      existingSymbols.add(t.symbol.toLowerCase());
      existingNameCount.set(
        t.name.toLowerCase(),
        (existingNameCount.get(t.name.toLowerCase()) ?? 0) + 1,
      );
      existingSymCount.set(
        t.symbol.toLowerCase(),
        (existingSymCount.get(t.symbol.toLowerCase()) ?? 0) + 1,
      );
    }

    const newMetadataConfSum =
      existingTokens.reduce((s, t) => s + t.metadataConfidence, 0) + metadataConfidence;
    const newB20ConfSum =
      existingTokens.reduce((s, t) => s + t.b20Confidence, 0) + b20Classification.confidence;

    const firstDeployment =
      existingTokens.length > 0
        ? existingTokens.reduce(
            (earliest, t) => (t.blockTimestamp < earliest ? t.blockTimestamp : earliest),
            existingTokens[0].blockTimestamp,
          )
        : blockTimestamp;
    const spanMs = blockTimestamp.getTime() - firstDeployment.getTime();
    const deploymentSpanDays = spanMs / (1000 * 60 * 60 * 24);

    const newUniqueNames =
      existingNames.size + (existingNames.has(result.metadata.name.toLowerCase()) ? 0 : 1);
    const newUniqueSymbols =
      existingSymbols.size + (existingSymbols.has(result.metadata.symbol.toLowerCase()) ? 0 : 1);
    let newDupNames = 0;
    for (const c of existingNameCount.values()) {
      if (c > 1) newDupNames += c - 1;
    }
    let newDupSyms = 0;
    for (const c of existingSymCount.values()) {
      if (c > 1) newDupSyms += c - 1;
    }

    const repMetrics = {
      totalTokens: allTokens + 1,
      lowRiskTokens: existingLow,
      mediumRiskTokens: existingMedium,
      highRiskTokens: existingHigh,
      avgRiskScore:
        existingRiskCount > 0 ? Math.round(existingTotalRisk / existingRiskCount) : null,
      avgMetadataConfidence: Math.round(newMetadataConfSum / (allTokens + 1)),
      avgB20Confidence: Math.round(newB20ConfSum / (allTokens + 1)),
      uniqueNames: newUniqueNames,
      uniqueSymbols: newUniqueSymbols,
      duplicateNames: newDupNames,
      duplicateSymbols: newDupSyms,
      deploymentSpanDays,
    };

    const repResult = calculateDeployerReputation(repMetrics);

    let token;
    try {
      token = await this.tokenRepo.createToken({
        chain: this.chain.name,
        chainId: this.chain.chainId,
        contractAddress,
        deployer,
        name: result.metadata.name,
        symbol: result.metadata.symbol,
        decimals: result.metadata.decimals,
        totalSupply: result.metadata.totalSupply,
        blockNumber,
        blockTimestamp,
        transactionHash: tx.hash,
        metadataConfidence,
        isB20: b20Classification.isB20,
        b20Confidence: b20Classification.confidence,
        deployerReputation: repResult.score,
        deployerGrade: repResult.grade,
      });
    } catch (createError) {
      this.log.error('STAGE:createToken FAILED', {
        contract: contractAddress,
        error: String(createError),
      });
      throw createError;
    }
    this.log.info('STAGE:database insert success', {
      contract: contractAddress,
      tokenId: token.id,
    });

    this.tokenRepo
      .upsertDeployerAnalytics(deployer, repResult.score, repResult.grade)
      .catch((error) => {
        this.log.error('Failed to update deployer analytics', {
          contractAddress,
          deployer,
          error: String(error),
        });
      });

    this.log.info('New token discovered', {
      chain: this.chain.name,
      contractAddress,
      symbol: result.metadata.symbol,
      name: result.metadata.name,
      tokenId: token.id,
      metadataConfidence,
      deployerReputation: repResult.score,
      deployerGrade: repResult.grade,
    });

    await publishWatchEvent(
      token.id,
      'NEW_TOKEN',
      `New token ${result.metadata.name} (${result.metadata.symbol}) discovered on ${this.chain.displayName}`,
      {
        chain: this.chain.name,
        contractAddress,
        name: result.metadata.name,
        symbol: result.metadata.symbol,
      },
    );

    try {
      const analysisResult = await analyze(token, {
        currentBlockNumber: blockNumber,
        rpc: {
          ethCall: (to: string, data: string) => this.rpc.ethCall(to, data),
          getCode: (address: string) => this.rpc.getCode(address),
          getBalance: (address: string) => this.rpc.getBalance(address),
        },
        getDeployerCount: (deployer: string, chain: string) =>
          this.analysisRepo.getDeployerTokenCount(deployer, chain),
      });
      this.log.info('STAGE:risk analysis complete', {
        contract: contractAddress,
        riskScore: analysisResult.riskScore,
        riskLevel: analysisResult.riskLevel,
      });
      await this.analysisRepo.createAnalysis(token.id, analysisResult);

      const intelligence = analyzeToken({
        name: result.metadata.name,
        symbol: result.metadata.symbol,
        riskScore: analysisResult.riskScore,
        riskLevel: analysisResult.riskLevel,
        metadataConfidence,
        isB20: b20Classification.isB20,
        b20Confidence: b20Classification.confidence,
        deployerReputation: repResult.score,
        deployerGrade: repResult.grade,
        totalSupply: result.metadata.totalSupply,
        decimals: result.metadata.decimals,
      });

      this.log.info('STAGE:AI analysis complete', {
        contract: contractAddress,
        category: intelligence.category,
        recommendation: intelligence.recommendation,
        confidence: intelligence.confidence,
      });

      await this.tokenRepo.updateToken(token.id, {
        aiCategory: intelligence.category,
        aiRecommendation: intelligence.recommendation,
        aiConfidence: Math.round(intelligence.confidence),
        aiSummary: intelligence.summary,
      });

      this.log.info('STAGE:updateToken AI fields success', { contract: contractAddress });

      if (analysisResult.riskLevel === 'HIGH' || analysisResult.riskLevel === 'CRITICAL') {
        await this.tokenRepo
          .upsertDeployerAnalytics(deployer, repResult.score, repResult.grade)
          .catch((error) => {
            this.log.error('Failed to update deployer analytics after high risk', {
              contractAddress,
              deployer,
              error: String(error),
            });
          });

        publishWatchEvent(
          token.id,
          'HIGH_RISK',
          `${result.metadata.name} (${result.metadata.symbol}) flagged as ${analysisResult.riskLevel} risk (score: ${analysisResult.riskScore}/100)`,
          {
            chain: this.chain.name,
            contractAddress,
            riskScore: analysisResult.riskScore,
            riskLevel: analysisResult.riskLevel,
          },
        );
      }

      await this.recomputeWalletProfile(deployer, blockTimestamp);

      await this.recomputeSmartMoneyProfile(deployer);

      await this.recomputeFundingProfile(deployer, blockNumber);

      await this.updateTrends({
        chain: this.chain.name,
        deployer,
        aiCategory: intelligence.category,
        riskScore: analysisResult.riskScore,
        riskLevel: analysisResult.riskLevel,
        metadataConfidence,
        aiConfidence: Math.round(intelligence.confidence),
        deployerReputation: repResult.score,
        discoveredAt: blockTimestamp,
        isB20: b20Classification.isB20,
      });

      await this.generateTokenSignal(token.id, deployer, {
        chain: this.chain.name,
        contractAddress,
        name: result.metadata.name,
        symbol: result.metadata.symbol,
        riskScore: analysisResult.riskScore,
        riskLevel: analysisResult.riskLevel,
        metadataConfidence,
        aiConfidence: Math.round(intelligence.confidence),
        aiCategory: intelligence.category,
        aiRecommendation: intelligence.recommendation,
        isB20: b20Classification.isB20,
        deployerReputation: repResult.score,
        deployerGrade: repResult.grade,
        blockTimestamp,
      });
    } catch (error) {
      this.log.error('Analysis failed', {
        contractAddress,
        error: String(error),
      });
    }
  }

  private async updateTrends(input: {
    chain: string;
    deployer: string;
    aiCategory: string;
    riskScore: number;
    riskLevel: string;
    metadataConfidence: number;
    aiConfidence: number;
    deployerReputation: number;
    discoveredAt: Date;
    isB20: boolean;
  }): Promise<void> {
    try {
      const isHighRisk = input.riskLevel === 'HIGH' || input.riskLevel === 'CRITICAL';
      const periods = ['hourly', 'daily', 'weekly'] as const;

      for (const period of periods) {
        await this.trendRepo.upsertSnapshot(period, input.discoveredAt, {
          tokensIndexed: 1,
          highRiskTokens: isHighRisk ? 1 : 0,
          averageRisk: input.riskScore,
          averageMetadataConfidence: input.metadataConfidence,
          averageAIConfidence: input.aiConfidence,
          uniqueDeployers: 1,
          totalDeployments: 1,
        });

        await this.trendRepo.upsertCategoryTrend(input.aiCategory, period, input.discoveredAt, {
          tokensIndexed: 1,
          averageRisk: input.riskScore,
          averageConfidence: input.aiConfidence,
          uniqueDeployers: 1,
        });

        await this.trendRepo.upsertChainTrend(input.chain, period, input.discoveredAt, {
          tokensIndexed: 1,
          averageRisk: input.riskScore,
          averageMetadataConfidence: input.metadataConfidence,
          averageAIConfidence: input.aiConfidence,
          averageDeployerReputation: input.deployerReputation,
          uniqueDeployers: 1,
        });

        await this.trendRepo.upsertDeployerTrend(input.deployer, period, input.discoveredAt, {
          tokensIndexed: 1,
          averageRisk: input.riskScore,
          averageMetadataConfidence: input.metadataConfidence,
          averageAIConfidence: input.aiConfidence,
          reputation: input.deployerReputation,
        });
      }
    } catch (error) {
      this.log.error('Failed to update trends', {
        chain: input.chain,
        error: String(error),
      });
    }
  }

  private async recomputeWalletProfile(deployer: string, blockTimestamp: Date): Promise<void> {
    try {
      const tokens = await this.tokenRepo.getTokensByDeployer(deployer);

      const totalRiskScores: number[] = [];
      let highRisk = 0;
      let successful = 0;
      let totalMetaConf = 0;
      let totalAiConf = 0;
      let b20Count = 0;

      for (const t of tokens) {
        totalMetaConf += t.metadataConfidence;
        totalAiConf += t.aiConfidence;
        if (t.isB20) b20Count++;
      }

      const analyses = await this.analysisRepo.getAnalysesByTokenIds(tokens.map((t) => t.id));
      const analysisMap = new Map(analyses.map((a) => [a.tokenId, a]));

      for (const t of tokens) {
        const analysis = analysisMap.get(t.id);
        if (analysis) {
          totalRiskScores.push(analysis.riskScore);
          if (analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRITICAL') highRisk++;
          if (analysis.riskLevel === 'LOW' || analysis.riskLevel === 'SAFE') successful++;
        }
      }

      const firstSeen =
        tokens.length > 0
          ? tokens.reduce(
              (earliest, t) => (t.discoveredAt < earliest ? t.discoveredAt : earliest),
              tokens[0].discoveredAt,
            )
          : blockTimestamp;
      const lastSeen = blockTimestamp;
      const walletAgeDays = Math.round((Date.now() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
      const spanMs = lastSeen.getTime() - firstSeen.getTime();
      const deploymentSpanDays = spanMs / (1000 * 60 * 60 * 24);

      const metrics: import('@token-intelligence-ai/analysis').WalletMetrics = {
        totalDeployments: tokens.length,
        successfulTokens: successful,
        highRiskTokens: highRisk,
        b20Tokens: b20Count,
        averageRisk:
          totalRiskScores.length > 0
            ? Math.round(totalRiskScores.reduce((a, b) => a + b, 0) / totalRiskScores.length)
            : null,
        averageMetadataConfidence: tokens.length > 0 ? totalMetaConf / tokens.length : 0,
        averageAiConfidence: tokens.length > 0 ? totalAiConf / tokens.length : 0,
        walletAgeDays,
        deploymentSpanDays,
      };

      const analysis = analyzeWallet(deployer, metrics, firstSeen, lastSeen);

      await this.walletRepo.updateWallet(deployer, {
        walletAgeDays: analysis.walletAgeDays,
        firstSeen,
        lastSeen,
        totalDeployments: analysis.totalDeployments,
        successfulTokens: analysis.successfulTokens,
        highRiskTokens: analysis.highRiskTokens,
        b20Tokens: analysis.b20Tokens,
        averageRisk: analysis.averageRisk,
        averageMetadataConfidence: analysis.averageMetadataConfidence,
        averageAiConfidence: analysis.averageAiConfidence,
        reputation: analysis.reputation,
        grade: analysis.grade,
        labels: analysis.labels,
        summary: analysis.summary,
      });

      this.log.info('Wallet profile updated', {
        deployer,
        reputation: analysis.reputation,
        grade: analysis.grade,
      });
    } catch (error) {
      this.log.error('Failed to recompute wallet profile', { deployer, error: String(error) });
    }
  }

  private async recomputeSmartMoneyProfile(deployer: string): Promise<void> {
    try {
      const tokens = await this.tokenRepo.getTokensByDeployer(deployer);
      if (tokens.length === 0) return;

      const analyses = await this.analysisRepo.getAnalysesByTokenIds(tokens.map((t) => t.id));
      const analysisMap = new Map(analyses.map((a) => [a.tokenId, a]));

      let successful = 0;
      let failed = 0;
      let highRisk = 0;
      let totalRisk = 0;
      let riskCount = 0;
      let totalMetaConf = 0;
      let totalAiConf = 0;
      let b20Count = 0;
      const chains = new Set<string>();
      const holdTimes: number[] = [];

      for (const t of tokens) {
        totalMetaConf += t.metadataConfidence;
        totalAiConf += t.aiConfidence;
        if (t.isB20) b20Count++;
        chains.add(t.chain);

        const analysis = analysisMap.get(t.id);
        if (analysis) {
          totalRisk += analysis.riskScore;
          riskCount++;
          if (analysis.riskLevel === 'LOW' || analysis.riskLevel === 'SAFE') successful++;
          else failed++;
          if (analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRITICAL') highRisk++;
        }

        const now = Date.now();
        const deployedMs = t.discoveredAt.getTime();
        const ageDays = (now - deployedMs) / (1000 * 60 * 60 * 24);
        if (ageDays > 0) holdTimes.push(ageDays);
      }

      const firstSeen = tokens.reduce(
        (earliest, t) => (t.discoveredAt < earliest ? t.discoveredAt : earliest),
        tokens[0].discoveredAt,
      );
      const lastSeen = tokens.reduce(
        (latest, t) => (t.discoveredAt > latest ? t.discoveredAt : latest),
        tokens[0].discoveredAt,
      );
      const walletAgeDays = Math.round((Date.now() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
      const spanMs = lastSeen.getTime() - firstSeen.getTime();
      const deploymentSpanDays = spanMs / (1000 * 60 * 60 * 24);

      const avgHoldTimeDays =
        holdTimes.length > 0
          ? Math.round((holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length) * 100) / 100
          : null;

      const result = calculateSmartMoneyScore({
        wallet: deployer,
        tokensCreated: tokens.length,
        successfulTokens: successful,
        failedTokens: failed,
        highRiskTokens: highRisk,
        averageRisk: riskCount > 0 ? Math.round(totalRisk / riskCount) : null,
        averageMetadataConfidence: tokens.length > 0 ? totalMetaConf / tokens.length : 0,
        averageAIConfidence: tokens.length > 0 ? totalAiConf / tokens.length : 0,
        reputation: 50,
        walletAgeDays,
        deploymentSpanDays,
        b20Count,
        chains: Array.from(chains),
        firstSeen,
        lastSeen,
      });

      await this.smartMoneyRepo.upsertProfile(deployer, {
        score: result.score,
        grade: result.grade,
        firstSeen,
        lastSeen,
        tokensCreated: tokens.length,
        averageRisk: riskCount > 0 ? totalRisk / riskCount : null,
        averageMetadataConfidence: tokens.length > 0 ? totalMetaConf / tokens.length : 0,
        averageAIConfidence: tokens.length > 0 ? totalAiConf / tokens.length : 0,
        successfulTokens: successful,
        failedTokens: failed,
        averageHoldTimeDays: avgHoldTimeDays,
        winRate: result.winRate,
        labels: result.labels,
        summary: result.summary,
      });

      this.log.info('Smart money profile updated', {
        deployer,
        score: result.score,
        grade: result.grade,
      });
    } catch (error) {
      this.log.error('Failed to recompute smart money profile', { deployer, error: String(error) });
    }
  }

  private async recomputeFundingProfile(deployer: string, currentBlock: bigint): Promise<void> {
    try {
      const tokens = await this.tokenRepo.getTokensByDeployer(deployer);
      if (tokens.length === 0) return;

      const deployerBlockTimestamp = tokens[0].blockTimestamp;

      const incomingTxs = await this.rpc.getInboundTransfers(deployer, 0n, currentBlock);
      const fundingResult = analyzeFunding(
        {
          deployer,
          deployerFirstSeen: deployerBlockTimestamp,
          deployerTxHash: tokens[0].transactionHash,
          deployerBlockNumber: currentBlock,
          deployerBlockTimestamp,
        },
        incomingTxs,
      );

      const fromBlock = fundingResult.fundingBlock ? BigInt(fundingResult.fundingBlock) : null;
      await this.fundingRepo.upsertFundingProfile(deployer, {
        fundedBy: fundingResult.fundedBy,
        fundingTxHash: fundingResult.fundingTxHash,
        fundingBlock: fromBlock,
        fundingTimestamp: fundingResult.fundingTimestamp,
        fundingAmount: fundingResult.fundingAmount,
        fundingCurrency: 'ETH',
        timeToDeploymentMinutes: fundingResult.timeToDeploymentMinutes,
        fundingSourceType: fundingResult.fundingSourceType,
        clusterId: fundingResult.fundedBy ? `cluster:${fundingResult.fundedBy}` : null,
        firstSeen: fundingResult.fundingTimestamp,
      });

      this.log.info('Funding profile updated', {
        deployer,
        source: fundingResult.fundingSourceType,
        confidence: fundingResult.confidence,
      });

      if (fundingResult.fundedBy) {
        const clusterProfiles = await this.fundingRepo.getWalletsByFunder(fundingResult.fundedBy);
        const activeWallets = new Map<string, { wallet: string; fundedBy: string | null }>();
        activeWallets.set(deployer, { wallet: deployer, fundedBy: fundingResult.fundedBy });
        for (const p of clusterProfiles) {
          activeWallets.set(p.wallet, { wallet: p.wallet, fundedBy: p.fundedBy });
        }
        const graph = await buildFundingGraph(Array.from(activeWallets.values()));
        await this.fundingRepo.upsertCluster(fundingResult.fundedBy, {
          walletCount: graph.nodes.length,
          deployments: graph.edges.length,
          successfulTokens: 0,
          highRiskTokens: 0,
          chains: [this.chain.name],
          totalFunding: fundingResult.fundingAmount ?? '0',
          firstSeen: fundingResult.fundingTimestamp,
          lastSeen: deployerBlockTimestamp,
        });
      }
    } catch (error) {
      this.log.error('Failed to recompute funding profile', { deployer, error: String(error) });
    }
  }

  private async generateTokenSignal(
    tokenId: string,
    deployer: string,
    ctx: {
      chain: string;
      contractAddress: string;
      name: string;
      symbol: string;
      riskScore: number;
      riskLevel: string;
      metadataConfidence: number;
      aiConfidence: number;
      aiCategory: string;
      aiRecommendation: string;
      isB20: boolean;
      deployerReputation: number;
      deployerGrade: string;
      blockTimestamp: Date;
    },
  ): Promise<void> {
    try {
      const [smartMoneyProfile, fundingProfile, walletProfile] = await Promise.all([
        this.smartMoneyRepo.getProfile(deployer),
        this.fundingRepo.getFundingProfile(deployer),
        this.walletRepo.getWallet(deployer),
      ]);

      const clusterSize = fundingProfile?.fundedBy
        ? (await this.fundingRepo.getWalletsByFunder(fundingProfile.fundedBy)).length
        : null;

      const smScore = smartMoneyProfile?.score ?? null;
      const smGrade = smartMoneyProfile?.grade ?? null;

      const engine = new SignalEngine();
      const signalInput = {
        tokenId,
        contractAddress: ctx.contractAddress,
        chain: ctx.chain,
        name: ctx.name,
        symbol: ctx.symbol,
        deployer,
        riskScore: ctx.riskScore,
        riskLevel: ctx.riskLevel,
        aiCategory: ctx.aiCategory,
        aiConfidence: ctx.aiConfidence,
        aiRecommendation: ctx.aiRecommendation,
        metadataConfidence: ctx.metadataConfidence,
        isB20: ctx.isB20,
        deployerReputation: ctx.deployerReputation,
        deployerGrade: ctx.deployerGrade,
        discoveredAt: ctx.blockTimestamp,
        smartMoneyScore: smScore,
        smartMoneyGrade: smGrade,
        fundingSourceType: fundingProfile?.fundingSourceType ?? 'Unknown',
        fundingSourceLabel: fundingProfile?.fundingSourceLabel ?? 'Unknown',
        fundingAmount: fundingProfile?.fundingAmount ?? null,
        timeToDeploymentMinutes: fundingProfile?.timeToDeploymentMinutes ?? null,
        fundedBy: fundingProfile?.fundedBy ?? null,
        fundedByClusterSize: clusterSize,
        walletTotalDeployments: walletProfile?.totalDeployments ?? 0,
        walletSuccessfulTokens: walletProfile?.successfulTokens ?? 0,
        walletHighRiskTokens: walletProfile?.highRiskTokens ?? 0,
        walletAgeDays: walletProfile?.walletAgeDays ?? null,
        graphClusterSize: null,
        graphClusterScore: null,
        graphRecursiveFundingDepth: null,
        graphSharedDeployers: 0,
        graphHasCircularFunding: false,
        graphTeamWalletOverlap: 0,
      };

      const result = engine.generateTokenSignal(signalInput);

      await this.signalRepo.upsertSignal(tokenId, {
        tokenId,
        signal: result.signal,
        rating: result.rating,
        headline: result.headline,
        summary: result.summary,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        reasons: result.reasons,
        recommendation: result.recommendation,
        opportunityScore: result.opportunityScore,
        riskScore: result.riskScore,
        confidence: result.confidence,
      });

      this.log.info('Signal generated', {
        chain: ctx.chain,
        contract: ctx.contractAddress,
        signal: result.signal,
        rating: result.rating,
        confidence: result.confidence,
      });
    } catch (error) {
      this.log.error('Failed to generate signal', {
        chain: ctx.chain,
        tokenId,
        error: String(error),
      });
    }
  }
}
