import { describe, it, expect } from 'vitest';
import { analyze } from '../analyzer.js';
import type { Token } from '@token-intelligence-ai/database';
import type { RpcProvider } from '../types.js';

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
  metadataConfidence: 100,
  isB20: false,
  b20Confidence: 0,
  deployerReputation: 0,
  deployerGrade: 'Unknown',
  discoveredAt: new Date(),
  blockNumber: 1000n,
  blockTimestamp: new Date(),
  transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
};

function makeRpc(overrides?: Partial<RpcProvider>): RpcProvider {
  return {
    ethCall: async () => '0x',
    getCode: async () => '0x60806040',
    getBalance: async () => '0x0',
    ...overrides,
  };
}

describe('analyze', () => {
  it('returns a complete analysis with metrics', async () => {
    const result = await analyze(baseToken, {
      currentBlockNumber: 2000n,
      rpc: makeRpc(),
      getDeployerCount: async () => 1,
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(result.riskLevel);
    expect(result.explanation).toBeTruthy();
    expect(result.factors.length).toBeGreaterThanOrEqual(15);
    expect(result.analyzedAt).toBeTruthy();
    expect(typeof result.ownerRenounced).toBe('boolean');
    expect(typeof result.mintable).toBe('boolean');
  });

  it('produces higher scores for risky tokens', async () => {
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
      rpc: makeRpc(),
      getDeployerCount: async () => 0,
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(40);
    expect(['MEDIUM', 'HIGH', 'CRITICAL']).toContain(result.riskLevel);
  });

  it('produces low scores for safe tokens', async () => {
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
      rpc: makeRpc({ getCode: async () => '0x' + '60'.repeat(200) }),
      getDeployerCount: async () => 5,
    });

    expect(result.riskScore).toBeLessThanOrEqual(30);
    expect(['SAFE', 'LOW']).toContain(result.riskLevel);
  });

  it('includes explanation in output', async () => {
    const result = await analyze(baseToken, {
      currentBlockNumber: 2000n,
      rpc: makeRpc(),
      getDeployerCount: async () => 1,
    });

    expect(result.explanation.length).toBeGreaterThan(0);
  });
});
