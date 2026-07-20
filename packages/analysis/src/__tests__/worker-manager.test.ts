import { describe, it, expect } from 'vitest';
import { CHAIN_NAMES, ENABLE_MAP } from '@token-intelligence-ai/shared';

describe('Worker Manager', () => {
  it('all chain names are known', () => {
    expect(CHAIN_NAMES).toContain('base');
    expect(CHAIN_NAMES).toContain('robinhood');
    expect(CHAIN_NAMES).toContain('ethereum');
    expect(CHAIN_NAMES).toContain('polygon');
  });

  it('base is enabled by default', () => {
    expect(ENABLE_MAP.base).toBe(true);
  });

  it('robinhood is enabled by default', () => {
    expect(ENABLE_MAP.robinhood).toBe(true);
  });

  it('ethereum requires explicit opt-in', () => {
    expect(ENABLE_MAP.ethereum).toBe(false);
  });

  it('polygon requires explicit opt-in', () => {
    expect(ENABLE_MAP.polygon).toBe(false);
  });

  it('adding a future chain only requires adding to CHAIN_NAMES and ENABLE_MAP', () => {
    const futureChains = ['arbitrum', 'optimism', 'avalanche'];
    for (const chain of futureChains) {
      expect(CHAIN_NAMES).not.toContain(chain);
    }
  });
});
