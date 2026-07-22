import { describe, it, expect } from 'vitest';
import {
  CANONICAL_CHAINS,
  CHAIN_NAMES,
  ENABLE_MAP,
  getCanonicalChain,
  getChainLogo,
  getChainColor,
} from '@token-intelligence-ai/shared';

describe('Chain Registry', () => {
  it('has exactly 4 chains', () => {
    expect(CHAIN_NAMES).toHaveLength(4);
  });

  it('includes base, robinhood, ethereum, polygon', () => {
    expect(CHAIN_NAMES).toContain('base');
    expect(CHAIN_NAMES).toContain('robinhood');
    expect(CHAIN_NAMES).toContain('ethereum');
    expect(CHAIN_NAMES).toContain('polygon');
  });

  it('has correct chain IDs', () => {
    expect(CANONICAL_CHAINS.base.chainId).toBe(8453);
    expect(CANONICAL_CHAINS.robinhood.chainId).toBe(4663);
    expect(CANONICAL_CHAINS.ethereum.chainId).toBe(1);
    expect(CANONICAL_CHAINS.polygon.chainId).toBe(137);
  });

  it('has explorer URLs for all chains', () => {
    for (const name of CHAIN_NAMES) {
      expect(CANONICAL_CHAINS[name].explorerUrl).toBeTruthy();
      expect(CANONICAL_CHAINS[name].explorerUrl).toContain('https://');
    }
  });

  it('has native currency for all chains', () => {
    for (const name of CHAIN_NAMES) {
      const currency = CANONICAL_CHAINS[name].nativeCurrency;
      expect(currency).toBeDefined();
      expect(currency.symbol).toBeTruthy();
      expect(currency.decimals).toBeGreaterThan(0);
    }
  });

  it('supports contracts on all chains', () => {
    for (const name of CHAIN_NAMES) {
      expect(CANONICAL_CHAINS[name].supportsContracts).toBe(true);
    }
  });

  it('Base and Robinhood enabled by default', () => {
    expect(ENABLE_MAP.base).toBe(true);
    expect(ENABLE_MAP.robinhood).toBe(true);
  });

  it('Ethereum and Polygon disabled by default', () => {
    expect(ENABLE_MAP.ethereum).toBe(false);
    expect(ENABLE_MAP.polygon).toBe(false);
  });

  it('has display names for all chains', () => {
    expect(CANONICAL_CHAINS.base.displayName).toBe('Base');
    expect(CANONICAL_CHAINS.robinhood.displayName).toBe('Robinhood Chain');
    expect(CANONICAL_CHAINS.ethereum.displayName).toBe('Ethereum');
    expect(CANONICAL_CHAINS.polygon.displayName).toBe('Polygon');
  });

  it('returns canonical chain for valid names', () => {
    const base = getCanonicalChain('base');
    expect(base.chainId).toBe(8453);
  });

  it('throws for unknown chain', () => {
    expect(() => getCanonicalChain('unknown' as never)).toThrow('Unknown chain');
  });

  it('has logos for all chains', () => {
    for (const name of CHAIN_NAMES) {
      expect(getChainLogo(name)).toBeTruthy();
    }
  });

  it('has colors for all chains', () => {
    for (const name of CHAIN_NAMES) {
      expect(getChainColor(name)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('Multi-Chain Architecture', () => {
  it('all chains have unique chain IDs', () => {
    const ids = CHAIN_NAMES.map((name) => CANONICAL_CHAINS[name].chainId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all chains have unique display names', () => {
    const names = CHAIN_NAMES.map((name) => CANONICAL_CHAINS[name].displayName);
    expect(new Set(names).size).toBe(names.length);
  });

  it('explorer URLs are unique per chain', () => {
    const urls = CHAIN_NAMES.map((name) => CANONICAL_CHAINS[name].explorerUrl);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('Robinhood uses Blockscout explorer', () => {
    expect(CANONICAL_CHAINS.robinhood.explorerUrl).toContain('blockscout');
  });

  it('Base uses basescan', () => {
    expect(CANONICAL_CHAINS.base.explorerUrl).toContain('basescan');
  });

  it('Ethereum uses etherscan', () => {
    expect(CANONICAL_CHAINS.ethereum.explorerUrl).toContain('etherscan');
  });

  it('Polygon uses polygonscan', () => {
    expect(CANONICAL_CHAINS.polygon.explorerUrl).toContain('polygonscan');
  });
});
