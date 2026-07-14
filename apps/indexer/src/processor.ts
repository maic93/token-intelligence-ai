import { TokenRepository } from '@token-intelligence-ai/database';
import type { Logger } from '@token-intelligence-ai/shared';
import type { RpcClient, RpcTransaction } from './rpc.js';
import { detectErc20 } from './erc20.js';

const CHAIN = 'base' as const;

export class BlockProcessor {
  constructor(
    private readonly rpc: RpcClient,
    private readonly tokenRepo: TokenRepository,
    private readonly log: Logger,
  ) {}

  async processBlock(blockNumber: bigint): Promise<void> {
    const block = await this.rpc.getBlock(blockNumber);
    const blockTimestamp = new Date(parseInt(block.timestamp, 16) * 1000);

    for (const tx of block.transactions) {
      if (tx.to !== null) continue;

      try {
        await this.processContractCreation(tx, blockNumber, blockTimestamp);
      } catch (error) {
        this.log.error('Failed to process transaction', {
          txHash: tx.hash,
          blockNumber: blockNumber.toString(),
          error: String(error),
        });
      }
    }

    await this.tokenRepo.saveLastProcessedBlock(CHAIN, blockNumber);
  }

  private async processContractCreation(
    tx: RpcTransaction,
    blockNumber: bigint,
    blockTimestamp: Date,
  ): Promise<void> {
    const receipt = await this.rpc.getTransactionReceipt(tx.hash);

    if (!receipt.contractAddress) return;
    if (receipt.status !== '0x1') return;

    const contractAddress = receipt.contractAddress.toLowerCase();

    const exists = await this.tokenRepo.tokenExists(CHAIN, contractAddress);
    if (exists) {
      this.log.info('Duplicate skipped', { contractAddress, chain: CHAIN });
      return;
    }

    const metadata = await detectErc20(this.rpc, contractAddress);
    if (!metadata) {
      this.log.info('Metadata failure', { contractAddress });
      return;
    }

    await this.tokenRepo.createToken({
      chain: CHAIN,
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
      contractAddress,
      symbol: metadata.symbol,
      name: metadata.name,
      decimals: metadata.decimals,
      deployer: tx.from,
      blockNumber: blockNumber.toString(),
    });
  }
}
