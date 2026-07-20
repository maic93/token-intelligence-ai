import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadChainConfig,
  loadAllChainConfigs,
  getChainDisplayName,
} from '@token-intelligence-ai/blockchain';

// Temporarily set env vars for testing
const ORIGINAL_ENV = { ...process.env };
beforeEach(() => {
  process.env.BASE_RPC_URL = 'https://mainnet.base.org';
  process.env.ROBINHOOD_RPC_URL = 'https://rpc.robinhood.com';
  process.env.ETHEREUM_RPC_URL = '';
  process.env.POLYGON_RPC_URL = '';
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('Blockchain Config', () => {
  describe('loadChainConfig', () => {
    it('loads base config correctly', () => {
      const cfg = loadChainConfig('base');
      expect(cfg.name).toBe('base');
      expect(cfg.chainId).toBe(8453);
      expect(cfg.explorerUrl).toBe('https://basescan.org');
      expect(cfg.rpcUrl).toBe('https://mainnet.base.org');
      expect(cfg.enabled).toBe(true);
      expect(cfg.supportsContracts).toBe(true);
    });

    it('loads robinhood config with correct chainId', () => {
      const cfg = loadChainConfig('robinhood');
      expect(cfg.name).toBe('robinhood');
      expect(cfg.chainId).toBe(4663);
      expect(cfg.displayName).toBe('Robinhood Chain');
    });

    it('loads robinhood with Blockscout explorer', () => {
      const cfg = loadChainConfig('robinhood');
      expect(cfg.explorerUrl).toBe('https://robinhoodchain.blockscout.com');
    });

    it('disables chain when RPC URL is empty', () => {
      const cfg = loadChainConfig('ethereum');
      expect(cfg.enabled).toBe(false);
    });

    it('robinhood is enabled when RPC URL is set', () => {
      const cfg = loadChainConfig('robinhood');
      expect(cfg.enabled).toBe(true);
    });
  });

  describe('loadAllChainConfigs', () => {
    it('returns all chains', () => {
      const configs = loadAllChainConfigs();
      expect(configs).toHaveLength(4);
    });

    it('only base and robinhood are enabled', () => {
      const configs = loadAllChainConfigs();
      const enabled = configs.filter((c) => c.enabled);
      expect(enabled.map((c) => c.name)).toEqual(['base', 'robinhood']);
    });
  });

  describe('getChainDisplayName', () => {
    it('returns correct display names', () => {
      expect(getChainDisplayName('base')).toBe('Base');
      expect(getChainDisplayName('robinhood')).toBe('Robinhood Chain');
      expect(getChainDisplayName('ethereum')).toBe('Ethereum');
      expect(getChainDisplayName('polygon')).toBe('Polygon');
    });
  });
});
