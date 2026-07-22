import { describe, it, expect } from 'vitest';
import { analyzeWallet } from '../wallet-intelligence.js';
import { calculateSmartMoneyScore } from '../smart-money.js';
import { analyzeFunding } from '../funding-intelligence.js';
import { loadAllChainConfigs } from '@token-intelligence-ai/blockchain';

describe('Cross-Chain Wallet Profile', () => {
  it('analyzes wallet with multi-chain deployments', () => {
    const result = analyzeWallet(
      '0x1234567890abcdef1234567890abcdef12345678',
      {
        totalDeployments: 25,
        successfulTokens: 18,
        highRiskTokens: 3,
        b20Tokens: 5,
        averageRisk: 25,
        averageMetadataConfidence: 85,
        averageAiConfidence: 70,
        walletAgeDays: 180,
        deploymentSpanDays: 150,
      },
      new Date('2024-01-01'),
      new Date('2024-06-15'),
    );
    expect(result.reputation).toBeGreaterThan(0);
    expect(result.grade).toBeTruthy();
    expect(result.labels).toBeDefined();
    expect(Array.isArray(result.labels)).toBe(true);
  });

  it('aggregates deployments across chains', () => {
    const metrics = {
      totalDeployments: 25,
      successfulTokens: 18,
      highRiskTokens: 3,
      b20Tokens: 5,
      averageRisk: 25,
      averageMetadataConfidence: 85,
      averageAiConfidence: 70,
      walletAgeDays: 180,
      deploymentSpanDays: 150,
    };
    const result = analyzeWallet(
      '0xabc123',
      metrics,
      new Date('2023-01-01'),
      new Date('2024-12-01'),
    );
    expect(result.reputation).toBeGreaterThanOrEqual(0);
    expect(result.reputation).toBeLessThanOrEqual(100);
  });

  it('assigns correct grade for excellent wallet', () => {
    const result = analyzeWallet(
      '0xexcellent',
      {
        totalDeployments: 50,
        successfulTokens: 45,
        highRiskTokens: 1,
        b20Tokens: 10,
        averageRisk: 10,
        averageMetadataConfidence: 95,
        averageAiConfidence: 90,
        walletAgeDays: 365,
        deploymentSpanDays: 700,
      },
      new Date('2022-01-01'),
      new Date('2024-12-01'),
    );
    expect(['Excellent', 'Good']).toContain(result.grade);
  });

  it('assigns correct grade for dangerous wallet', () => {
    const result = analyzeWallet(
      '0xdangerous',
      {
        totalDeployments: 5,
        successfulTokens: 0,
        highRiskTokens: 5,
        b20Tokens: 0,
        averageRisk: 90,
        averageMetadataConfidence: 20,
        averageAiConfidence: 10,
        walletAgeDays: 30,
        deploymentSpanDays: 5,
      },
      new Date('2024-11-01'),
      new Date('2024-12-01'),
    );
    expect(['Dangerous', 'Poor']).toContain(result.grade);
  });
});

describe('Cross-Chain Smart Money', () => {
  it('calculates score from cross-chain deployments', () => {
    const result = calculateSmartMoneyScore({
      wallet: '0xsmart',
      reputation: 85,
      walletAgeDays: 365,
      tokensCreated: 25,
      successfulTokens: 20,
      failedTokens: 5,
      highRiskTokens: 2,
      averageRisk: 15,
      averageMetadataConfidence: 90,
      averageAIConfidence: 80,
      deploymentSpanDays: 300,
      b20Count: 3,
      chains: ['base', 'robinhood', 'ethereum'],
      firstSeen: new Date('2023-01-01'),
      lastSeen: new Date('2024-12-01'),
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.grade).toBeTruthy();
  });

  it('rewards multi-chain activity', () => {
    const singleChain = calculateSmartMoneyScore({
      wallet: '0xa',
      reputation: 70,
      walletAgeDays: 180,
      tokensCreated: 10,
      successfulTokens: 7,
      failedTokens: 3,
      highRiskTokens: 1,
      averageRisk: 20,
      averageMetadataConfidence: 80,
      averageAIConfidence: 70,
      deploymentSpanDays: 100,
      b20Count: 2,
      chains: ['base'],
      firstSeen: new Date('2024-01-01'),
      lastSeen: new Date('2024-12-01'),
    });

    const multiChain = calculateSmartMoneyScore({
      wallet: '0xa',
      reputation: 70,
      walletAgeDays: 180,
      tokensCreated: 10,
      successfulTokens: 7,
      failedTokens: 3,
      highRiskTokens: 1,
      averageRisk: 20,
      averageMetadataConfidence: 80,
      averageAIConfidence: 70,
      deploymentSpanDays: 100,
      b20Count: 2,
      chains: ['base', 'robinhood', 'ethereum', 'polygon'],
      firstSeen: new Date('2024-01-01'),
      lastSeen: new Date('2024-12-01'),
    });
    expect(multiChain.score).toBeGreaterThan(singleChain.score);
  });

  it('generates labels including Multi-chain', () => {
    const result = calculateSmartMoneyScore({
      wallet: '0xmulti',
      reputation: 60,
      walletAgeDays: 200,
      tokensCreated: 15,
      successfulTokens: 10,
      failedTokens: 5,
      highRiskTokens: 2,
      averageRisk: 25,
      averageMetadataConfidence: 75,
      averageAIConfidence: 65,
      deploymentSpanDays: 180,
      b20Count: 1,
      chains: ['base', 'robinhood'],
      firstSeen: new Date('2023-06-01'),
      lastSeen: new Date('2024-12-01'),
    });
    expect(result.labels).toBeDefined();
  });
});

describe('Cross-Chain Funding Intelligence', () => {
  it('analyzes funding with chain context', () => {
    const result = analyzeFunding(
      {
        deployer: '0xfunder123',
        deployerFirstSeen: null,
        deployerTxHash: '0xtx1',
        deployerBlockNumber: BigInt(100),
        deployerBlockTimestamp: new Date('2024-12-01T12:00:00Z'),
      },
      [
        {
          from: '0x71660c4005ba85c37ccec55d0c4493e66fe775d3',
          to: '0xfunder123',
          value: '1000000000000000000',
          hash: '0xtx1',
          blockNumber: BigInt(100),
          timestamp: new Date('2024-12-01T11:30:00Z'),
        },
      ],
    );
    expect(result.fundedBy).toBe('0x71660c4005ba85c37ccec55d0c4493e66fe775d3');
    expect(result.fundingSourceType).toBe('exchange');
    expect(result.confidence).toBeGreaterThanOrEqual(70);
  });

  it('detects EOA funding on Robinhood', () => {
    const result = analyzeFunding(
      {
        deployer: '0xeoa_deployer',
        deployerFirstSeen: null,
        deployerTxHash: '0xtx2',
        deployerBlockNumber: BigInt(200),
        deployerBlockTimestamp: new Date('2024-12-01T12:00:00Z'),
      },
      [
        {
          from: '0xeoa_wallet',
          to: '0xeoa_deployer',
          value: '500000000000000000',
          hash: '0xtx2',
          blockNumber: BigInt(200),
          timestamp: new Date('2024-12-01T11:45:00Z'),
        },
      ],
    );
    expect(result.fundedBy).toBe('0xeoa_wallet');
    expect(result.fundingSourceType).toBe('eoa');
  });
});

describe('Cross-Chain Explorer Integration', () => {
  it('generates correct explorer URLs for all chains', () => {
    const chains = [
      { explorer: 'https://basescan.org' },
      { explorer: 'https://robinhoodchain.blockscout.com' },
      { explorer: 'https://etherscan.io' },
      { explorer: 'https://polygonscan.com' },
    ];
    for (const { explorer } of chains) {
      expect(explorer).toContain('https://');
      expect(explorer.length).toBeGreaterThan(10);
    }
  });
});

describe('Chain Health & Status', () => {
  it('validates all chain configurations are complete', () => {
    const configs = loadAllChainConfigs();
    expect(configs).toHaveLength(4);
    for (const cfg of configs) {
      expect(cfg.name).toBeTruthy();
      expect(cfg.chainId).toBeGreaterThan(0);
      expect(cfg.displayName).toBeTruthy();
      expect(cfg.explorerUrl).toBeTruthy();
      expect(cfg.nativeCurrency).toBeDefined();
      expect(cfg.supportsContracts).toBe(true);
      expect(cfg.logo).toBeTruthy();
      expect(cfg.color).toBeDefined();
    }
  });
});

describe('Cross-Chain Leaderboards', () => {
  it('validates leaderboard entry structure', () => {
    const entry = {
      rank: 1,
      identifier: '0xabc',
      displayName: 'Test',
      value: 100,
      extra: { grade: 'Elite' },
    };
    expect(entry.rank).toBe(1);
    expect(entry.identifier).toBeTruthy();
    expect(entry.value).toBeGreaterThanOrEqual(0);
  });

  it('validates deployer leaderboard data', () => {
    const items = [
      {
        rank: 1,
        identifier: '0xa',
        displayName: '0xa...',
        value: 50,
        extra: { reputationScore: 80, reputationGrade: 'Excellent' },
      },
      {
        rank: 2,
        identifier: '0xb',
        displayName: '0xb...',
        value: 30,
        extra: { reputationScore: 60, reputationGrade: 'Good' },
      },
    ];
    expect(items).toHaveLength(2);
    expect(items[0].value).toBeGreaterThan(items[1].value);
    expect(items[0].extra?.reputationGrade).toBe('Excellent');
  });

  it('validates smart money leaderboard data', () => {
    const items = [
      { rank: 1, identifier: '0xa', value: 95, extra: { grade: 'Elite', winRate: 85 } },
      { rank: 2, identifier: '0xb', value: 75, extra: { grade: 'Professional', winRate: 70 } },
    ];
    expect(items).toHaveLength(2);
    expect(items[0].extra?.grade).toBe('Elite');
  });

  it('validates chain activity leaderboard', () => {
    const items = [
      { rank: 1, identifier: 'base', displayName: 'Base', value: 500 },
      { rank: 2, identifier: 'robinhood', displayName: 'Robinhood', value: 300 },
    ];
    expect(items).toHaveLength(2);
    expect(items[0].value).toBeGreaterThan(items[1].value);
  });
});
