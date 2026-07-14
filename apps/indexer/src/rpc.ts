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

export class RpcClient {
  private nextId = 0;

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

        const response = await fetch(this.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });

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
    const hex = await this.call<string>('eth_blockNumber', []);
    return BigInt(hex);
  }

  async getBlock(blockNumber: bigint): Promise<RpcBlock> {
    const hex = '0x' + blockNumber.toString(16);
    return this.call<RpcBlock>('eth_getBlockByNumber', [hex, true]);
  }

  async getTransactionReceipt(txHash: string): Promise<RpcTransactionReceipt> {
    return this.call<RpcTransactionReceipt>('eth_getTransactionReceipt', [txHash]);
  }

  async ethCall(to: string, data: string, options?: CallOptions): Promise<string> {
    return this.call<string>('eth_call', [{ to, data }, 'latest'], options);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
