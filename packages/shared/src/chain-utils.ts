import { CANONICAL_CHAINS } from './chains.js';
import type { ChainName } from './chains.js';

export function getExplorerTx(chain: string, txHash: string): string {
  const c = CANONICAL_CHAINS[chain as ChainName];
  const base = c?.explorerUrl ?? 'https://basescan.org';
  return `${base}/tx/${txHash}`;
}

export function getExplorerAddress(chain: string, address: string): string {
  const c = CANONICAL_CHAINS[chain as ChainName];
  const base = c?.explorerUrl ?? 'https://basescan.org';
  return `${base}/address/${address}`;
}

export function getExplorerContract(chain: string, address: string): string {
  const c = CANONICAL_CHAINS[chain as ChainName];
  const base = c?.explorerUrl ?? 'https://basescan.org';
  return `${base}/address/${address}`;
}

export function formatNative(chain: string, value: bigint, decimals: number = 18): string {
  const divisor = 10n ** BigInt(decimals);
  const integer = value / divisor;
  const fraction = value % divisor;
  const padded = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  const c = CANONICAL_CHAINS[chain as ChainName];
  const symbol = c?.nativeCurrency.symbol ?? 'ETH';
  return padded ? `${integer}.${padded} ${symbol}` : `${integer} ${symbol}`;
}

export function supportsContracts(chain: string): boolean {
  const c = CANONICAL_CHAINS[chain as ChainName];
  return c?.supportsContracts ?? false;
}

export function getChainExplorer(chain: string): string {
  const c = CANONICAL_CHAINS[chain as ChainName];
  return c?.explorerUrl ?? 'https://basescan.org';
}

export function getChainCurrency(chain: string): {
  name: string;
  symbol: string;
  decimals: number;
} {
  const c = CANONICAL_CHAINS[chain as ChainName];
  return c?.nativeCurrency ?? { name: 'Ether', symbol: 'ETH', decimals: 18 };
}
