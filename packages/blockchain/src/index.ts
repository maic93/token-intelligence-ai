export type ChainName = 'base' | 'robinhood' | 'ethereum' | 'polygon';

export const CHAIN_NAMES: ChainName[] = ['base', 'robinhood', 'ethereum', 'polygon'];

export interface ChainConfig {
  name: ChainName;
  rpcUrl?: string;
  enabled: boolean;
}

export function getChainConfig(name: ChainName): ChainConfig {
  return {
    name,
    enabled: true,
  };
}

export function loadAllChainConfigs(): ChainConfig[] {
  return CHAIN_NAMES.map(getChainConfig);
}

export function getChainDisplayName(name: ChainName): string {
  const names: Record<ChainName, string> = {
    base: 'Base',
    robinhood: 'Robinhood',
    ethereum: 'Ethereum',
    polygon: 'Polygon',
  };
  return names[name];
}
