import { describe, it, expect } from 'vitest';
import { analyze } from '../analyzer.js';
import type { Token } from '@token-intelligence-ai/database';

const baseToken: Token = {
  id: 'test-id',
  chain: 'base',
  chainId: 8453,
  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
  deployer: '0xabcdef1234567890abcdef1234567890abcdef12',
  name: 'TestToken',
  symbol: 'TEST',
  decimals: 18,
  totalSupply: '1000000000000000000000000',
  discoveredAt: new Date(),
  blockNumber: 1000n,
  blockTimestamp: new Date(),
  transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
};

describe('analyze', () => {
  it('returns a complete RiskAnalysis', async () => {
    const result = await analyze(baseToken, {
      currentBlockNumber: 2000n,
      getDeployerCount: async () => 1,
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(['very_safe', 'low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    expect(result.explanation).toBeTruthy();
    expect(result.factors.length).toBeGreaterThanOrEqual(7);
    expect(result.analyzedAt).toBeTruthy();
  });

  it('produces lower scores for risky tokens', async () => {
    const riskyToken: Token = {
      ...baseToken,
      name: '',
      symbol: '',
      decimals: 255,
      totalSupply: '99999999999999999999999999999999',
      blockNumber: 1999n,
    };

    const result = await analyze(riskyToken, {
      currentBlockNumber: 2000n,
      getDeployerCount: async () => 0,
    });

    expect(result.riskScore).toBeLessThan(50);
    expect(['high', 'critical']).toContain(result.riskLevel);
  });

  it('produces high scores for safe tokens', async () => {
    const safeToken: Token = {
      ...baseToken,
      name: 'SafeToken',
      symbol: 'SAFE',
      decimals: 18,
      totalSupply: '1000000',
      blockNumber: 0n,
    };

    const result = await analyze(safeToken, {
      currentBlockNumber: 10000n,
      getDeployerCount: async () => 5,
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(90);
    expect(result.riskLevel).toBe('very_safe');
  });

  it('includes explanation in output', async () => {
    const result = await analyze(baseToken, {
      currentBlockNumber: 2000n,
      getDeployerCount: async () => 1,
    });

    expect(result.explanation.length).toBeGreaterThan(0);
  });
});
