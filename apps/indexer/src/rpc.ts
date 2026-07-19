import type { Logger } from '@token-intelligence-ai/shared';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: unknown[];
}

interface JsonRpcSuccess<T> {
  jsonrpc: '2.0';
  id: number;
  result: T;
}

interface JsonRpcError {
  jsonrpc: '2.0';
  id: number;
  error: { code: number; message: string };
}

type JsonRpcResponse<T> = JsonRpcSuccess<T> | JsonRpcError;

export interface RpcBlock {
  number: string;
  timestamp: string;
  transactions: RpcTransaction[];
}

export interface RpcTransaction {
  hash: string;
  from: string;
  to: string | null;
  input: string;
  blockNumber: string;
}

export interface RpcTransactionReceipt {
  transactionHash: string;
  contractAddress: string | null;
  status: string;
  blockNumber: string;
}

export interface CallOptions {
  retry?: boolean;
}

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RECEIPT_CONCURRENCY = 8;
const BLOCK_CACHE_REFRESH_MS = 6_000;

export class RpcClient {
  private nextId = 0;
  private cachedLatestBlock: bigint | null = null;
  private lastCacheRefresh = 0;

  constructor(
    private readonly url: string,
    private readonly log: Logger,
  ) {}

  async call<T>(method: string, params: unknown[], options?: CallOptions): Promise<T> {
    const shouldRetry = options?.retry !== false;
    const maxAttempts = shouldRetry ? MAX_ATTEMPTS : 1;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        const delayMs = Math.min(BASE_DELAY_MS * 2 ** (attempt - 2), MAX_DELAY_MS);
        this.log.warn('RPC retry', { method, attempt, delayMs });
        await sleep(delayMs);
      }

      try {
        this.nextId++;
        const request: JsonRpcRequest = {
          jsonrpc: '2.0',
          id: this.nextId,
          method,
          params,
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        let response: Response;
        try {
          response = await fetch(this.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = (await response.json()) as JsonRpcResponse<T>;

        if ('error' in json) {
          throw new Error(`RPC error ${json.error.code}: ${json.error.message}`);
        }

        return json.result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === maxAttempts) break;
      }
    }

    throw lastError;
  }

  async getLatestBlockNumber(): Promise<bigint> {
    const now = Date.now();
    if (this.cachedLatestBlock !== null && now - this.lastCacheRefresh < BLOCK_CACHE_REFRESH_MS) {
      return this.cachedLatestBlock;
    }
    const hex = await this.call<string>('eth_blockNumber', []);
    const block = BigInt(hex);
    this.cachedLatestBlock = block;
    this.lastCacheRefresh = now;
    return block;
  }

  async getBlock(blockNumber: bigint): Promise<RpcBlock> {
    const hex = '0x' + blockNumber.toString(16);
    return this.call<RpcBlock>('eth_getBlockByNumber', [hex, true]);
  }

  async getTransactionReceipt(txHash: string): Promise<RpcTransactionReceipt> {
    return this.call<RpcTransactionReceipt>('eth_getTransactionReceipt', [txHash]);
  }

  async getTransactionReceipts(txHashes: string[]): Promise<(RpcTransactionReceipt | null)[]> {
    const results: (RpcTransactionReceipt | null)[] = new Array(txHashes.length).fill(null);
    let index = 0;

    async function worker(this: RpcClient): Promise<void> {
      while (index < txHashes.length) {
        const i = index++;
        try {
          results[i] = await this.getTransactionReceipt(txHashes[i]);
        } catch {
          // individual receipt failure, leave as null
        }
      }
    }

    const workers: Promise<void>[] = [];
    const count = Math.min(MAX_RECEIPT_CONCURRENCY, txHashes.length);
    for (let i = 0; i < count; i++) {
      workers.push(worker.call(this));
    }
    await Promise.allSettled(workers);
    return results;
  }

  async ethCall(to: string, data: string, options?: CallOptions): Promise<string> {
    return this.call<string>('eth_call', [{ to, data }, 'latest'], options);
  }

  async getCode(address: string): Promise<string> {
    return this.call<string>('eth_getCode', [address, 'latest']);
  }

  async getBalance(address: string): Promise<string> {
    return this.call<string>('eth_getBalance', [address, 'latest']);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
