import { describe, it, expect } from 'vitest';
import {
  getExplorerAddress,
  getExplorerTx,
  getExplorerContract,
  getChainExplorer,
} from '@token-intelligence-ai/shared';

describe('Explorer Utils', () => {
  describe('getExplorerAddress', () => {
    it('returns correct URL for base', () => {
      expect(getExplorerAddress('base', '0x123')).toBe('https://basescan.org/address/0x123');
    });

    it('returns correct URL for robinhood', () => {
      expect(getExplorerAddress('robinhood', '0x456')).toBe(
        'https://robinhoodchain.blockscout.com/address/0x456',
      );
    });

    it('returns correct URL for ethereum', () => {
      expect(getExplorerAddress('ethereum', '0x789')).toBe('https://etherscan.io/address/0x789');
    });

    it('returns correct URL for polygon', () => {
      expect(getExplorerAddress('polygon', '0xabc')).toBe('https://polygonscan.com/address/0xabc');
    });
  });

  describe('getExplorerTx', () => {
    it('generates tx URL for base', () => {
      expect(getExplorerTx('base', '0xtx')).toBe('https://basescan.org/tx/0xtx');
    });

    it('generates tx URL for robinhood', () => {
      expect(getExplorerTx('robinhood', '0xtx')).toBe(
        'https://robinhoodchain.blockscout.com/tx/0xtx',
      );
    });
  });

  describe('getExplorerContract', () => {
    it('aliases to explorer address URL', () => {
      expect(getExplorerContract('base', '0xcontract')).toBe(
        getExplorerAddress('base', '0xcontract'),
      );
    });
  });

  describe('getChainExplorer', () => {
    it('returns explorer base URL for each chain', () => {
      expect(getChainExplorer('base')).toBe('https://basescan.org');
      expect(getChainExplorer('robinhood')).toBe('https://robinhoodchain.blockscout.com');
      expect(getChainExplorer('ethereum')).toBe('https://etherscan.io');
      expect(getChainExplorer('polygon')).toBe('https://polygonscan.com');
    });
  });
});
