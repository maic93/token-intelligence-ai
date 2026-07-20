import { describe, it, expect } from 'vitest';
import { loadAllChainConfigs } from '@token-intelligence-ai/blockchain';

describe('Chain Analytics', () => {
  it('loadAllChainConfigs returns array of all chains', () => {
    const configs = loadAllChainConfigs();
    expect(Array.isArray(configs)).toBe(true);
    expect(configs.length).toBeGreaterThanOrEqual(4);
  });

  it('each chain config has required fields', () => {
    const configs = loadAllChainConfigs();
    for (const cfg of configs) {
      expect(cfg).toHaveProperty('name');
      expect(cfg).toHaveProperty('chainId');
      expect(cfg).toHaveProperty('displayName');
      expect(cfg).toHaveProperty('explorerUrl');
      expect(cfg).toHaveProperty('nativeCurrency');
      expect(cfg).toHaveProperty('enabled');
      expect(cfg).toHaveProperty('supportsContracts');
      expect(cfg.supportsContracts).toBe(true);
    }
  });

  it('each chain has native currency with symbol', () => {
    const configs = loadAllChainConfigs();
    for (const cfg of configs) {
      expect(cfg.nativeCurrency.symbol).toBeTruthy();
      expect(cfg.nativeCurrency.decimals).toBe(18);
    }
  });
});
