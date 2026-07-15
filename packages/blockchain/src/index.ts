export type ChainName = 'base' | 'robinhood' | 'ethereum' | 'polygon';

export const CHAIN_NAMES = ['base', 'robinhood', 'ethereum', 'polygon'] as const;

export interface ChainConfig {
  name: ChainName;
  rpcUrl: string;
  enabled: boolean;
  startBlock: number;
}

const DEFAULT_RPC_URLS: Record<ChainName, string> = {
  base: 'https://mainnet.base.org',
  robinhood: '',
  ethereum: '',
  polygon: '',
};

const ENV_RPC_KEYS: Record<ChainName, string> = {
  base: 'BASE_RPC_URL',
  robinhood: 'CHAIN_ROBINHOOD_RPC_URL',
  ethereum: 'CHAIN_ETHEREUM_RPC_URL',
  polygon: 'CHAIN_POLYGON_RPC_URL',
};

export function loadChainConfig(name: ChainName): ChainConfig {
  const envKey = ENV_RPC_KEYS[name];
  const envUrl = process.env[envKey] ?? '';
  const defaultUrl = DEFAULT_RPC_URLS[name];
  const rpcUrl = envUrl || defaultUrl;

  return {
    name,
    rpcUrl,
    enabled: rpcUrl.length > 0,
    startBlock: 0,
  };
}

export function loadAllChainConfigs(): ChainConfig[] {
  return CHAIN_NAMES.map(loadChainConfig).filter((c) => c.enabled);
}

export function getChainDisplayName(name: ChainName): string {
  const labels: Record<ChainName, string> = {
    base: 'Base',
    robinhood: 'Robinhood',
    ethereum: 'Ethereum',
    polygon: 'Polygon',
  };
  return labels[name];
}
