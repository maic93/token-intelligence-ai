import { prisma, TokenRepository } from '@token-intelligence-ai/database';
import type { ChainName } from '@token-intelligence-ai/blockchain';

const CHAIN: ChainName = 'base';
const DEFAULT_RPC_URL = 'https://mainnet.base.org';
const POLL_INTERVAL_MS = 12_000;

const tokenRepo = new TokenRepository(prisma);

async function getLastBlock(): Promise<bigint> {
  const lastBlock = await tokenRepo.getLastProcessedBlock(CHAIN);
  return lastBlock ?? 0n;
}

async function processNewBlock(blockNumber: bigint): Promise<void> {
  console.log(`[indexer] Processing block ${blockNumber} on ${CHAIN}`);

  const rpcUrl = process.env.CHAIN_BASE_RPC_URL ?? DEFAULT_RPC_URL;

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBlockByNumber',
      params: [hexBlockNumber(blockNumber), true],
    }),
  });

  const data = (await response.json()) as {
    result?: {
      number: string;
      timestamp: string;
      transactions: Array<{
        hash: string;
        from: string;
        to: string | null;
        input: string;
      }>;
    };
  };

  if (!data.result) {
    console.warn(`[indexer] No data for block ${blockNumber}`);
    return;
  }

  const block = data.result;
  const blockTimestamp = new Date(parseInt(block.timestamp, 16) * 1000);

  for (const tx of block.transactions) {
    if (!tx.to && tx.input.startsWith('0x6080604052')) {
      console.log(`[indexer] Detected contract deployment: ${tx.hash}`);

      const existing = await tokenRepo.tokenExists(CHAIN, tx.hash);
      if (!existing) {
        await tokenRepo.createToken({
          chain: CHAIN,
          contractAddress: tx.hash,
          deployer: tx.from,
          name: 'Unknown',
          symbol: 'UNK',
          decimals: 18,
          totalSupply: '0',
          blockNumber,
          blockTimestamp,
          transactionHash: tx.hash,
        });
        console.log(`[indexer] Stored token deployment: ${tx.hash}`);
      }
    }
  }

  await tokenRepo.saveLastProcessedBlock(CHAIN, blockNumber);
}

function hexBlockNumber(n: bigint): string {
  return '0x' + n.toString(16);
}

async function poll(): Promise<void> {
  let lastBlock = await getLastBlock();
  console.log(`[indexer] Starting from block ${lastBlock} on ${CHAIN}`);

  for (;;) {
    try {
      const rpcUrl = process.env.CHAIN_BASE_RPC_URL ?? DEFAULT_RPC_URL;
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
      });

      const data = (await response.json()) as { result?: string };
      if (!data.result) {
        console.warn('[indexer] Failed to fetch latest block');
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      const latestBlock = BigInt(data.result);

      while (lastBlock < latestBlock) {
        lastBlock += 1n;
        await processNewBlock(lastBlock);
      }
    } catch (error) {
      console.error('[indexer] Poll error:', error);
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

poll().catch((error) => {
  console.error('[indexer] Fatal error:', error);
  process.exit(1);
});
