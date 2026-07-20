import { describe, it, expect } from 'vitest';
import {
  CANONICAL_CHAINS,
  CHAIN_NAMES,
  ENABLE_MAP,
  getCanonicalChain,
} from '@token-intelligence-ai/shared';

describe('Chain Registry', () => {
  it('has all chains registered', () => {
    expect(CHAIN_NAMES).toEqual(['base', 'robinhood', 'ethereum', 'polygon']);
  });

  it('base has correct chainId', () => {
    expect(CANONICAL_CHAINS.base.chainId).toBe(8453);
  });

  it('base has correct explorer', () => {
    expect(CANONICAL_CHAINS.base.explorerUrl).toBe('https://basescan.org');
  });

  it('robinhood has correct chainId', () => {
    expect(CANONICAL_CHAINS.robinhood.chainId).toBe(4663);
  });

  it('robinhood has correct display name', () => {
    expect(CANONICAL_CHAINS.robinhood.displayName).toBe('Robinhood Chain');
  });

  it('robinhood uses Blockscout explorer', () => {
    expect(CANONICAL_CHAINS.robinhood.explorerUrl).toBe('https://robinhoodchain.blockscout.com');
  });

  it('robinhood native currency is ETH', () => {
    expect(CANONICAL_CHAINS.robinhood.nativeCurrency.symbol).toBe('ETH');
  });

  it('ethereum has correct chainId', () => {
    expect(CANONICAL_CHAINS.ethereum.chainId).toBe(1);
  });

  it('polygon has correct chainId', () => {
    expect(CANONICAL_CHAINS.polygon.chainId).toBe(137);
  });

  it('all chains support contracts', () => {
    for (const name of CHAIN_NAMES) {
      expect(CANONICAL_CHAINS[name].supportsContracts).toBe(true);
    }
  });

  it('base and robinhood are enabled by default', () => {
    expect(ENABLE_MAP.base).toBe(true);
    expect(ENABLE_MAP.robinhood).toBe(true);
  });

  it('ethereum and polygon require explicit opt-in', () => {
    expect(ENABLE_MAP.ethereum).toBe(false);
    expect(ENABLE_MAP.polygon).toBe(false);
  });

  it('getCanonicalChain returns known chain', () => {
    const chain = getCanonicalChain('base');
    expect(chain.name).toBe('base');
  });

  it('getCanonicalChain throws for unknown chain', () => {
    expect(() => getCanonicalChain('unknown' as 'base')).toThrow();
  });
});
