export type ChainName = 'base' | 'robinhood' | 'ethereum' | 'polygon';

export const CHAIN_NAMES: ChainName[] = ['base', 'robinhood', 'ethereum', 'polygon'];

export interface ChainDefinition {
  name: ChainName;
  chainId: number;
  displayName: string;
  rpcUrl: string;
  explorerUrl: string;
  enabled: boolean;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  supportsContracts: boolean;
}

export const CANONICAL_CHAINS: Record<ChainName, Omit<ChainDefinition, 'rpcUrl' | 'enabled'>> = {
  base: {
    name: 'base',
    chainId: 8453,
    displayName: 'Base',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    supportsContracts: true,
  },
  ethereum: {
    name: 'ethereum',
    chainId: 1,
    displayName: 'Ethereum',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    supportsContracts: true,
  },
  polygon: {
    name: 'polygon',
    chainId: 137,
    displayName: 'Polygon',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    supportsContracts: true,
  },
  robinhood: {
    name: 'robinhood',
    chainId: 4663,
    displayName: 'Robinhood Chain',
    explorerUrl: 'https://robinhoodchain.blockscout.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    supportsContracts: true,
  },
};

export const ENABLE_MAP: Record<ChainName, boolean> = {
  base: true,
  robinhood: true,
  ethereum: false,
  polygon: false,
};

export function getCanonicalChain(name: ChainName): Omit<ChainDefinition, 'rpcUrl' | 'enabled'> {
  const chain = CANONICAL_CHAINS[name];
  if (!chain) throw new Error(`Unknown chain: ${name}`);
  return chain;
}
