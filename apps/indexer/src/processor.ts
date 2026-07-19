import { AnalysisRepository, TokenRepository } from '@token-intelligence-ai/database';
import type { Logger } from '@token-intelligence-ai/shared';
import type { ChainConfig } from '@token-intelligence-ai/blockchain';
import { analyze } from '@token-intelligence-ai/analysis';
import type { RpcClient, RpcTransaction } from './rpc.js';
import { detectErc20 } from './erc20.js';
import { publishWatchEvent } from './watch-publisher.js';

const SHORT_INPUT_LENGTH = 10; // 4-byte selector (0x + 8 hex) = 10 chars

export class BlockProcessor {
  constructor(
    private readonly chain: ChainConfig,
    private readonly rpc: RpcClient,
    private readonly tokenRepo: TokenRepository,
    private readonly analysisRepo: AnalysisRepository,
    private readonly log: Logger,
  ) {}

  private canCreateContract(tx: RpcTransaction): boolean {
    if (tx.to === null) return true;
    if (tx.input.length > SHORT_INPUT_LENGTH) return true;
    return false;
  }

  async processBlock(blockNumber: bigint): Promise<void> {
    const block = await this.rpc.getBlock(blockNumber);
    const blockTimestamp = new Date(parseInt(block.timestamp, 16) * 1000);

    const deployable = block.transactions.filter((tx) => this.canCreateContract(tx));
    if (deployable.length === 0) {
      await this.tokenRepo.saveLastProcessedBlock(this.chain.name, blockNumber);
      return;
    }

    const receipts = await this.rpc.getTransactionReceipts(deployable.map((tx) => tx.hash));

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
    const exists = await this.tokenRepo.tokenExists(this.chain.name, contractAddress);
    if (exists) return;

    const metadata = await detectErc20(this.rpc, contractAddress);
    if (!metadata) return;

    const token = await this.tokenRepo.createToken({
      chain: this.chain.name,
      chainId: this.chain.chainId,
      contractAddress,
      deployer: tx.from.toLowerCase(),
      name: metadata.name,
      symbol: metadata.symbol,
      decimals: metadata.decimals,
      totalSupply: metadata.totalSupply,
      blockNumber,
      blockTimestamp,
      transactionHash: tx.hash,
    });

    this.log.info('New token discovered', {
      chain: this.chain.name,
      contractAddress,
      symbol: metadata.symbol,
      name: metadata.name,
      tokenId: token.id,
    });

    await publishWatchEvent(
      token.id,
      'NEW_TOKEN',
      `New token ${metadata.name} (${metadata.symbol}) discovered on ${this.chain.displayName}`,
      { chain: this.chain.name, contractAddress, name: metadata.name, symbol: metadata.symbol },
    );

    try {
      const result = await analyze(token, {
        currentBlockNumber: blockNumber,
        rpc: {
          ethCall: (to: string, data: string) => this.rpc.ethCall(to, data),
          getCode: (address: string) => this.rpc.getCode(address),
          getBalance: (address: string) => this.rpc.getBalance(address),
        },
        getDeployerCount: (deployer: string, chain: string) =>
          this.analysisRepo.getDeployerTokenCount(deployer, chain),
      });
      await this.analysisRepo.createAnalysis(token.id, result);

      if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
        await publishWatchEvent(
          token.id,
          'HIGH_RISK',
          `${metadata.name} (${metadata.symbol}) flagged as ${result.riskLevel} risk (score: ${result.riskScore}/100)`,
          {
            chain: this.chain.name,
            contractAddress,
            riskScore: result.riskScore,
            riskLevel: result.riskLevel,
          },
        );
      }
    } catch (error) {
      this.log.error('Analysis failed', {
        contractAddress,
        error: String(error),
      });
    }
  }
}
