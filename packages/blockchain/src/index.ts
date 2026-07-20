import {
  CANONICAL_CHAINS,
  CHAIN_NAMES,
  ENABLE_MAP,
  getCanonicalChain,
} from '@token-intelligence-ai/shared';
import type { ChainName, ChainDefinition } from '@token-intelligence-ai/shared';

export type { ChainName, ChainDefinition } from '@token-intelligence-ai/shared';

export const CHAIN_NAMES_EXPORT: ChainName[] = [...CHAIN_NAMES];

export type ChainConfig = ChainDefinition;

function readRpcUrl(name: ChainName): string {
  const envKey = `${name.toUpperCase()}_RPC_URL`;
  const url = process.env[envKey];
  if (!url || url.trim() === '') return '';
  return url;
}

function isExplicitlyEnabled(name: ChainName): boolean {
  const defaults = ENABLE_MAP[name];
  if (defaults) return true;
  const envKey = `ENABLE_${name.toUpperCase()}`;
  return process.env[envKey] === 'true';
}

export function loadChainConfig(name: ChainName): ChainConfig {
  const def = getCanonicalChain(name);
  const rpcUrl = readRpcUrl(name);
  const hasRpc = rpcUrl.length > 0;
  const defaults = ENABLE_MAP[name];
  const isEnabled = defaults ? hasRpc : hasRpc && isExplicitlyEnabled(name);
  return {
    ...def,
    rpcUrl,
    enabled: isEnabled,
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
  return CANONICAL_CHAINS[name]?.displayName ?? name;
}
