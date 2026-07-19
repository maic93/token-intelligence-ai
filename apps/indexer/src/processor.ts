import { AnalysisRepository, TokenRepository } from '@token-intelligence-ai/database';
import type { Logger } from '@token-intelligence-ai/shared';
import type { ChainConfig } from '@token-intelligence-ai/blockchain';
import { analyze } from '@token-intelligence-ai/analysis';
import type { RpcClient, RpcTransaction } from './rpc.js';
import { detectErc20 } from './erc20.js';
import { publishWatchEvent } from './watch-publisher.js';

export class BlockProcessor {
  constructor(
    private readonly chain: ChainConfig,
    private readonly rpc: RpcClient,
    private readonly tokenRepo: TokenRepository,
    private readonly analysisRepo: AnalysisRepository,
    private readonly log: Logger,
  ) {}

  async processBlock(blockNumber: bigint): Promise<void> {
    const block = await this.rpc.getBlock(blockNumber);
    const blockTimestamp = new Date(parseInt(block.timestamp, 16) * 1000);

    const totalTxs = block.transactions.length;

    if (totalTxs > 0) {
      this.log.info('ProcessBlock detail', {
        block: blockNumber.toString(),
        totalTransactions: totalTxs,
      });
    }

    const receipts = await this.rpc.getTransactionReceipts(block.transactions.map((tx) => tx.hash));

    let contractDeployments = 0;

    for (let i = 0; i < block.transactions.length; i++) {
      const tx = block.transactions[i];
      const receipt = receipts[i];

      if (!receipt) continue;
      if (!receipt.contractAddress) continue;
      if (receipt.status !== '0x1') continue;

      contractDeployments++;

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

    if (contractDeployments > 0) {
      this.log.info('Block processed', {
        block: blockNumber.toString(),
        totalTransactions: totalTxs,
        contractDeployments,
      });
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
    if (exists) {
      return;
    }

    this.log.info('Contract deployed', {
      contractAddress,
      deployer: tx.from,
      txHash: tx.hash,
      block: blockNumber.toString(),
    });

    const metadata = await detectErc20(this.rpc, contractAddress);
    if (!metadata) {
      this.log.info('Not an ERC20 token', { contractAddress });
      return;
    }

    this.log.info('ERC20 validated, saving token', {
      contractAddress,
      name: metadata.name,
      symbol: metadata.symbol,
      decimals: metadata.decimals,
    });

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

    this.log.info('Token saved to database', {
      tokenId: token.id,
      contractAddress,
      symbol: metadata.symbol,
      name: metadata.name,
    });

    await publishWatchEvent(
      token.id,
      'NEW_TOKEN',
      `New token ${metadata.name} (${metadata.symbol}) discovered on ${this.chain.displayName}`,
      { chain: this.chain.name, contractAddress, name: metadata.name, symbol: metadata.symbol },
    );

    this.log.info('Watch event published', { tokenId: token.id, eventType: 'NEW_TOKEN' });

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
      this.log.info('Token analyzed', {
        contractAddress,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
      });

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
