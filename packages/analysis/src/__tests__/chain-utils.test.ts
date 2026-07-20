import { describe, it, expect } from 'vitest';
import {
  getExplorerTx,
  getExplorerAddress,
  getExplorerContract,
  formatNative,
  supportsContracts,
  getChainExplorer,
  getChainCurrency,
} from '@token-intelligence-ai/shared';

describe('Chain Utils', () => {
  describe('getExplorerTx', () => {
    it('returns correct URL for base', () => {
      expect(getExplorerTx('base', '0x123')).toBe('https://basescan.org/tx/0x123');
    });

    it('returns correct URL for robinhood', () => {
      expect(getExplorerTx('robinhood', '0xabc')).toBe(
        'https://robinhoodchain.blockscout.com/tx/0xabc',
      );
    });

    it('returns correct URL for ethereum', () => {
      expect(getExplorerTx('ethereum', '0x456')).toBe('https://etherscan.io/tx/0x456');
    });

    it('returns correct URL for polygon', () => {
      expect(getExplorerTx('polygon', '0x789')).toBe('https://polygonscan.com/tx/0x789');
    });
  });

  describe('getExplorerAddress', () => {
    it('returns correct URL for base', () => {
      expect(getExplorerAddress('base', '0xaddr')).toBe('https://basescan.org/address/0xaddr');
    });

    it('returns correct URL for robinhood', () => {
      expect(getExplorerAddress('robinhood', '0xaddr')).toBe(
        'https://robinhoodchain.blockscout.com/address/0xaddr',
      );
    });
  });

  describe('getExplorerContract', () => {
    it('returns correct URL for base', () => {
      expect(getExplorerContract('base', '0xcontract')).toBe(
        'https://basescan.org/address/0xcontract',
      );
    });

    it('returns correct URL for ethereum', () => {
      expect(getExplorerContract('ethereum', '0xcontract')).toBe(
        'https://etherscan.io/address/0xcontract',
      );
    });
  });

  describe('formatNative', () => {
    it('formats ETH for base', () => {
      const result = formatNative('base', 1500000000000000000n);
      expect(result).toBe('1.5 ETH');
    });

    it('formats POL for polygon', () => {
      const result = formatNative('polygon', 2000000000000000000n);
      expect(result).toBe('2 POL');
    });
  });

  describe('supportsContracts', () => {
    it('returns true for all known chains', () => {
      expect(supportsContracts('base')).toBe(true);
      expect(supportsContracts('robinhood')).toBe(true);
      expect(supportsContracts('ethereum')).toBe(true);
      expect(supportsContracts('polygon')).toBe(true);
    });

    it('returns false for unknown chain', () => {
      expect(supportsContracts('unknown')).toBe(false);
    });
  });

  describe('getChainExplorer', () => {
    it('returns correct explorer URL', () => {
      expect(getChainExplorer('base')).toBe('https://basescan.org');
      expect(getChainExplorer('robinhood')).toBe('https://robinhoodchain.blockscout.com');
      expect(getChainExplorer('ethereum')).toBe('https://etherscan.io');
      expect(getChainExplorer('polygon')).toBe('https://polygonscan.com');
    });
  });

  describe('getChainCurrency', () => {
    it('returns correct currency for polygon', () => {
      const cur = getChainCurrency('polygon');
      expect(cur.symbol).toBe('POL');
    });
  });
});
