export type ChainName = 'base' | 'robinhood' | 'ethereum' | 'polygon';

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
