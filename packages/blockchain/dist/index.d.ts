export type ChainName = 'base' | 'robinhood' | 'ethereum' | 'polygon';
export interface ChainConfig {
  name: ChainName;
  rpcUrl?: string;
  enabled: boolean;
}
export declare function getChainConfig(name: ChainName): ChainConfig;
