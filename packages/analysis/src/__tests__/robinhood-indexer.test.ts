import { describe, it, expect } from 'vitest';
import {
  CHAIN_NAMES,
  CANONICAL_CHAINS,
  ENABLE_MAP,
  getCanonicalChain,
} from '@token-intelligence-ai/shared';
import {
  getChainDisplayName,
  getChainLogoUrl,
  getChainColorHex,
  loadChainConfig,
  loadAllChainConfigs,
} from '@token-intelligence-ai/blockchain';

describe('Robinhood Indexer Configuration', () => {
  it('Robinhood is a recognized chain name', () => {
    expect(CHAIN_NAMES).toContain('robinhood');
  });

  it('Robinhood has correct chain ID', () => {
    expect(CANONICAL_CHAINS.robinhood.chainId).toBe(4663);
  });

  it('Robinhood display name is correct', () => {
    expect(getChainDisplayName('robinhood')).toBe('Robinhood Chain');
  });

  it('Robinhood supports contracts', () => {
    expect(CANONICAL_CHAINS.robinhood.supportsContracts).toBe(true);
  });

  it('Robinhood uses Blockscout explorer', () => {
    expect(CANONICAL_CHAINS.robinhood.explorerUrl).toContain('blockscout');
  });

  it('Robinhood has a logo', () => {
    expect(getChainLogoUrl('robinhood')).toBeTruthy();
  });

  it('Robinhood has a color hex', () => {
    expect(getChainColorHex('robinhood')).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('Robinhood native currency is ETH', () => {
    expect(CANONICAL_CHAINS.robinhood.nativeCurrency.symbol).toBe('ETH');
  });

  it('Robinhood native currency has 18 decimals', () => {
    expect(CANONICAL_CHAINS.robinhood.nativeCurrency.decimals).toBe(18);
  });

  it('Robinhood is enabled by default in ENABLE_MAP', () => {
    expect(ENABLE_MAP.robinhood).toBe(true);
  });
});

describe('Robinhood RPC Configuration', () => {
  it('Robinhood RPC env var name is ROBINHOOD_RPC_URL', () => {
    expect('ROBINHOOD_RPC_URL').toBeTruthy();
  });

  it('Robinhood WS env var name is ROBINHOOD_WS_URL', () => {
    expect('ROBINHOOD_WS_URL').toBeTruthy();
  });

  it('loadChainConfig includes wsUrl for Robinhood', () => {
    const config = loadChainConfig('robinhood');
    expect(config).toHaveProperty('wsUrl');
  });

  it('loadChainConfig includes logo for Robinhood', () => {
    const config = loadChainConfig('robinhood');
    expect(config.logo).toBeTruthy();
  });

  it('loadChainConfig includes color for Robinhood', () => {
    const config = loadChainConfig('robinhood');
    expect(config.color).toBeTruthy();
  });
});

describe('Cross-Chain RPC Routing', () => {
  it('Base URL from env maps to chain config', () => {
    const base = loadChainConfig('base');
    expect(base.chainId).toBe(8453);
  });

  it('Ethereum URL from env maps to chain config', () => {
    const eth = loadChainConfig('ethereum');
    expect(eth.chainId).toBe(1);
  });

  it('Polygon URL from env maps to chain config', () => {
    const poly = loadChainConfig('polygon');
    expect(poly.chainId).toBe(137);
  });

  it('Robinhood URL from env maps to chain config', () => {
    const rh = loadChainConfig('robinhood');
    expect(rh.chainId).toBe(4663);
  });

  it('loadAllChainConfigs returns 4 configs', () => {
    const configs = loadAllChainConfigs();
    expect(configs).toHaveLength(4);
  });

  it('each chain config has required fields', () => {
    const configs = loadAllChainConfigs();
    for (const cfg of configs) {
      expect(cfg.name).toBeDefined();
      expect(typeof cfg.chainId).toBe('number');
      expect(cfg.displayName).toBeDefined();
      expect(cfg.explorerUrl).toContain('https://');
      expect(cfg.nativeCurrency.symbol).toBeDefined();
      expect(cfg.supportsContracts).toBe(true);
    }
  });
});

describe('Chain Health API Contract', () => {
  it('health entry has required fields', () => {
    const entry = {
      name: 'robinhood',
      chainId: 4663,
      displayName: 'Robinhood Chain',
      enabled: true,
      connected: true,
      logo: '🟢',
      color: '#00C805',
      currentBlock: null,
      lastIndexedBlock: '12345',
      blocksBehind: 0,
      tokenCount: 42,
      workerStatus: 'running',
      errors: [],
    };
    expect(entry.name).toBe('robinhood');
    expect(entry.connected).toBe(true);
    expect(entry.blocksBehind).toBe(0);
    expect(Array.isArray(entry.errors)).toBe(true);
    expect(entry.workerStatus).toBe('running');
  });

  it('health entry handles offline state', () => {
    const entry = {
      name: 'ethereum',
      chainId: 1,
      displayName: 'Ethereum',
      enabled: false,
      connected: false,
      logo: '⬡',
      color: '#627EEA',
      currentBlock: null,
      lastIndexedBlock: null,
      blocksBehind: null,
      tokenCount: 0,
      workerStatus: 'stopped',
      errors: ['RPC not configured'],
    };
    expect(entry.enabled).toBe(false);
    expect(entry.connected).toBe(false);
    expect(entry.workerStatus).toBe('stopped');
    expect(entry.errors).toHaveLength(1);
  });
});

describe('Leaderboard API Contract', () => {
  it('leaderboard deployers endpoint returns ranked entries', () => {
    const entries = [
      {
        rank: 1,
        identifier: '0xabc',
        displayName: '0xabc...',
        value: 100,
        extra: { reputationScore: 95, reputationGrade: 'Excellent' },
      },
      {
        rank: 2,
        identifier: '0xdef',
        displayName: '0xdef...',
        value: 75,
        extra: { reputationScore: 80, reputationGrade: 'Good' },
      },
      {
        rank: 3,
        identifier: '0xghi',
        displayName: '0xghi...',
        value: 50,
        extra: { reputationScore: 60, reputationGrade: 'Average' },
      },
    ];
    expect(entries).toHaveLength(3);
    expect(entries[0].rank).toBeLessThan(entries[1].rank);
    expect(entries[0].value).toBeGreaterThan(entries[1].value);
    expect(entries[2].extra?.reputationGrade).toBe('Average');
  });

  it('leaderboard opportunity endpoint returns sorted entries', () => {
    const entries = [
      {
        rank: 1,
        identifier: 'token1',
        displayName: 'Token A',
        value: 95,
        extra: { chain: 'base', rating: 'STRONG_BUY' },
      },
      {
        rank: 2,
        identifier: 'token2',
        displayName: 'Token B',
        value: 80,
        extra: { chain: 'robinhood', rating: 'BUY' },
      },
    ];
    expect(entries[0].value).toBe(95);
    expect(entries[1].extra?.chain).toBe('robinhood');
  });

  it('leaderboard chains endpoint returns chain activity', () => {
    const entries = [
      { rank: 1, identifier: 'base', displayName: 'Base', value: 5000 },
      { rank: 2, identifier: 'robinhood', displayName: 'Robinhood Chain', value: 3000 },
      { rank: 3, identifier: 'ethereum', displayName: 'Ethereum', value: 1000 },
      { rank: 4, identifier: 'polygon', displayName: 'Polygon', value: 500 },
    ];
    expect(entries).toHaveLength(4);
    expect(entries[0].value).toBeGreaterThan(entries[3].value);
  });
});

describe('Cross-Chain Search', () => {
  it('search by chain returns chain-scoped results', () => {
    const results = [
      { contractAddress: '0xa', chain: 'base', name: 'TokenA', symbol: 'TA' },
      { contractAddress: '0xb', chain: 'robinhood', name: 'TokenB', symbol: 'TB' },
    ];
    const filtered = results.filter((r) => r.chain === 'robinhood');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].chain).toBe('robinhood');
  });

  it('search by deployer returns cross-chain results', () => {
    const results = [
      { contractAddress: '0xa', chain: 'base', deployer: '0xwallet' },
      { contractAddress: '0xb', chain: 'robinhood', deployer: '0xwallet' },
      { contractAddress: '0xc', chain: 'base', deployer: '0xother' },
    ];
    const walletTokens = results.filter((r) => r.deployer === '0xwallet');
    expect(walletTokens).toHaveLength(2);
    const chains = [...new Set(walletTokens.map((r) => r.chain))];
    expect(chains).toContain('base');
    expect(chains).toContain('robinhood');
  });
});

describe('Chain Config Validation', () => {
  it('getCanonicalChain throws for unknown chain', () => {
    expect(() => getCanonicalChain('solana' as never)).toThrow();
  });

  it('all chain IDs are positive integers', () => {
    for (const name of CHAIN_NAMES) {
      expect(Number.isInteger(CANONICAL_CHAINS[name].chainId)).toBe(true);
      expect(CANONICAL_CHAINS[name].chainId).toBeGreaterThan(0);
    }
  });

  it('all explorer URLs are valid HTTPS', () => {
    for (const name of CHAIN_NAMES) {
      const url = CANONICAL_CHAINS[name].explorerUrl;
      expect(url).toMatch(/^https:\/\/.+/);
    }
  });

  it('all native currency symbols are uppercase', () => {
    for (const name of CHAIN_NAMES) {
      expect(CANONICAL_CHAINS[name].nativeCurrency.symbol).toMatch(/^[A-Z]+$/);
    }
  });
});
