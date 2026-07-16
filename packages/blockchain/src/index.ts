export type ChainName = 'base' | 'robinhood' | 'ethereum' | 'polygon';

export const CHAIN_NAMES: ChainName[] = ['base', 'robinhood', 'ethereum', 'polygon'];

export interface ChainConfig {
  name: ChainName;
  chainId: number;
  displayName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  enabled: boolean;
}

function readRpcUrl(name: ChainName): string {
  const envKey = `${name.toUpperCase()}_RPC_URL`;
  const url = process.env[envKey];
  if (!url || url.trim() === '') return '';
  return url;
}

const CHAIN_DEFS: Record<ChainName, Omit<ChainConfig, 'rpcUrl' | 'enabled'>> = {
  base: {
    name: 'base',
    chainId: 8453,
    displayName: 'Base',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  ethereum: {
    name: 'ethereum',
    chainId: 1,
    displayName: 'Ethereum',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  polygon: {
    name: 'polygon',
    chainId: 137,
    displayName: 'Polygon',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  robinhood: {
    name: 'robinhood',
    chainId: 0,
    displayName: 'Robinhood',
    explorerUrl: 'https://explorer.robinhood.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
};

export function loadChainConfig(name: ChainName): ChainConfig {
  const def = CHAIN_DEFS[name];
  const rpcUrl = readRpcUrl(name);
  return {
    ...def,
    rpcUrl,
    enabled: rpcUrl.length > 0,
  };
}

export function loadAllChainConfigs(): ChainConfig[] {
  return CHAIN_NAMES.map(loadChainConfig);
}

export function getEnabledChains(): ChainConfig[] {
  return loadAllChainConfigs().filter((c) => c.enabled);
}

export function getChainConfig(name: ChainName): ChainConfig {
  return loadChainConfig(name);
}

export function getChainDisplayName(name: ChainName): string {
  return CHAIN_DEFS[name]?.displayName ?? name;
}
