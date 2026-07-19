import type { RpcClient } from './rpc.js';
import { createLogger } from '@token-intelligence-ai/shared';

const log = createLogger('indexer:erc20');

const SELECTOR_NAME = '0x06fdde03';
const SELECTOR_SYMBOL = '0x95d89b41';
const SELECTOR_DECIMALS = '0x313ce567';
const SELECTOR_TOTAL_SUPPLY = '0x18160ddd';

export interface Erc20Metadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export async function detectErc20(
  rpc: RpcClient,
  contractAddress: string,
): Promise<Erc20Metadata | null> {
  const [symbolResult, decimalsResult, nameResult, supplyResult] = await Promise.allSettled([
    rpc.ethCall(contractAddress, SELECTOR_SYMBOL),
    rpc.ethCall(contractAddress, SELECTOR_DECIMALS),
    rpc.ethCall(contractAddress, SELECTOR_NAME, { retry: false }),
    rpc.ethCall(contractAddress, SELECTOR_TOTAL_SUPPLY, { retry: false }),
  ]);

  if (symbolResult.status === 'rejected') {
    log.info('Not an ERC20 token', { contractAddress });
    return null;
  }
  if (decimalsResult.status === 'rejected') {
    log.info('Not an ERC20 token', { contractAddress });
    return null;
  }

  const symbol = decodeBytes32OrAbiString(symbolResult.value);
  const decimals = decodeUint8FromAbi(decimalsResult.value);

  if (!symbol) return null;
  if (isNaN(decimals)) return null;

  let name = symbol;
  if (nameResult.status === 'fulfilled') {
    const decoded = decodeBytes32OrAbiString(nameResult.value);
    if (decoded) name = decoded;
  }

  let totalSupply = '0';
  if (supplyResult.status === 'fulfilled') {
    totalSupply = decodeUint256FromAbi(supplyResult.value).toString();
  }

  return { name, symbol, decimals, totalSupply };
}

function hexToBytes(hex: string): number[] {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.substring(i, i + 2), 16));
  }
  return bytes;
}

function decodeBytes32(hex: string): string {
  const bytes = hexToBytes(hex);
  const nonZero = bytes.filter((b) => b !== 0);
  return new TextDecoder().decode(new Uint8Array(nonZero));
}

function decodeAbiString(hex: string): string {
  if (hex.length < 130) return '';

  const offset = parseInt(hex.substring(2, 66), 16);
  const dataStart = 2 + offset * 2;

  if (hex.length < dataStart + 64) return '';

  const length = parseInt(hex.substring(dataStart, dataStart + 64), 16);
  if (length < 1 || length > 256) return '';

  const dataHex = hex.substring(dataStart + 64, dataStart + 64 + length * 2);
  const bytes = hexToBytes(dataHex);

  return new TextDecoder().decode(new Uint8Array(bytes)).replace(/\0/g, '');
}

function decodeBytes32OrAbiString(hex: string): string {
  if (hex.length === 66) {
    return decodeBytes32(hex);
  }
  return decodeAbiString(hex);
}

function decodeUint8FromAbi(hex: string): number {
  return parseInt(hex.slice(-2), 16);
}

function decodeUint256FromAbi(hex: string): bigint {
  return BigInt(hex);
}
