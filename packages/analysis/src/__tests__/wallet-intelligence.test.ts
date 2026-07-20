import { describe, it, expect } from 'vitest';
import { analyzeWallet } from '../wallet-intelligence.js';
import type { WalletMetrics } from '../wallet-intelligence.js';

function makeMetrics(overrides: Partial<WalletMetrics> = {}): WalletMetrics {
  return {
    totalDeployments: 1,
    successfulTokens: 0,
    highRiskTokens: 0,
    b20Tokens: 0,
    averageRisk: null,
    averageMetadataConfidence: 50,
    averageAiConfidence: 0,
    walletAgeDays: null,
    deploymentSpanDays: 0,
    ...overrides,
  };
}

function makeResult(metrics: WalletMetrics) {
  const now = new Date();
  const firstSeen =
    metrics.walletAgeDays !== null
      ? new Date(now.getTime() - metrics.walletAgeDays * 86400000)
      : now;
  return analyzeWallet('0x1234567890abcdef1234567890abcdef12345678', metrics, firstSeen, now);
}

describe('analyzeWallet', () => {
  it('returns Excellent for high metadata confidence and many successful tokens', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 10,
        successfulTokens: 9,
        highRiskTokens: 0,
        averageRisk: 10,
        averageMetadataConfidence: 95,
        averageAiConfidence: 85,
        deploymentSpanDays: 60,
        walletAgeDays: 90,
      }),
    );
    expect(result.reputation).toBeGreaterThanOrEqual(80);
    expect(result.grade).toBe('Excellent');
  });

  it('returns Good for moderately good metrics', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 5,
        successfulTokens: 3,
        highRiskTokens: 1,
        averageRisk: 35,
        averageMetadataConfidence: 75,
        deploymentSpanDays: 10,
        walletAgeDays: 20,
      }),
    );
    expect(result.reputation).toBeGreaterThanOrEqual(60);
    expect(result.reputation).toBeLessThan(80);
    expect(result.grade).toBe('Good');
  });

  it('returns Average for moderate metrics', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 3,
        successfulTokens: 1,
        highRiskTokens: 1,
        averageRisk: 45,
        averageMetadataConfidence: 60,
        averageAiConfidence: 50,
        deploymentSpanDays: 5,
        walletAgeDays: 7,
      }),
    );
    expect(result.grade).toBe('Average');
  });

  it('returns Poor for many high-risk tokens', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 5,
        successfulTokens: 0,
        highRiskTokens: 2,
        averageRisk: 55,
        averageMetadataConfidence: 45,
        averageAiConfidence: 40,
        deploymentSpanDays: 2,
        walletAgeDays: 5,
      }),
    );
    expect(result.grade).toBe('Poor');
  });

  it('returns Dangerous for extremely bad metrics', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 8,
        successfulTokens: 0,
        highRiskTokens: 8,
        averageRisk: 90,
        averageMetadataConfidence: 10,
        averageAiConfidence: 0,
        deploymentSpanDays: 0.01,
        walletAgeDays: 0,
      }),
    );
    expect(result.reputation).toBeLessThan(20);
    expect(result.grade).toBe('Dangerous');
  });

  it('generates NEW_DEPLOYER label for single deployment', () => {
    const result = makeResult(makeMetrics({ totalDeployments: 1 }));
    expect(result.labels).toContain('NEW_DEPLOYER');
  });

  it('generates SERIAL_DEPLOYER label for 10+ deployments', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 10,
        successfulTokens: 5,
        averageMetadataConfidence: 60,
        deploymentSpanDays: 30,
      }),
    );
    expect(result.labels).toContain('SERIAL_DEPLOYER');
  });

  it('generates B20_CREATOR label for 3+ B20 tokens', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 5,
        b20Tokens: 3,
        averageMetadataConfidence: 50,
      }),
    );
    expect(result.labels).toContain('B20_CREATOR');
  });

  it('generates HIGH_RISK_CREATOR label for 3+ high risk tokens', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 5,
        highRiskTokens: 3,
        averageMetadataConfidence: 50,
      }),
    );
    expect(result.labels).toContain('HIGH_RISK_CREATOR');
  });

  it('generates SPAMMER label for poor grade with many deployments', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 5,
        highRiskTokens: 5,
        averageRisk: 95,
        averageMetadataConfidence: 10,
        deploymentSpanDays: 0.1,
      }),
    );
    expect(result.labels).toContain('SPAMMER');
  });

  it('generates TRUSTED_CREATOR label for good/excellent grade with 3+ deployments', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 3,
        successfulTokens: 3,
        averageRisk: 10,
        averageMetadataConfidence: 95,
        averageAiConfidence: 85,
        deploymentSpanDays: 30,
      }),
    );
    expect(result.labels).toContain('TRUSTED_CREATOR');
  });

  it('generates UTILITY_BUILDER label for 5+ deployments with zero high risk', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 5,
        successfulTokens: 5,
        highRiskTokens: 0,
        averageRisk: 10,
        averageMetadataConfidence: 80,
        deploymentSpanDays: 20,
      }),
    );
    expect(result.labels).toContain('UTILITY_BUILDER');
  });

  it('generates MEME_FACTORY label when B20 tokens exist', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 3,
        b20Tokens: 1,
        averageMetadataConfidence: 50,
      }),
    );
    expect(result.labels).toContain('MEME_FACTORY');
  });

  it('generates SUSPICIOUS label for 5+ high risk tokens', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 10,
        highRiskTokens: 5,
        averageRisk: 80,
        averageMetadataConfidence: 30,
        deploymentSpanDays: 1,
      }),
    );
    expect(result.labels).toContain('SUSPICIOUS');
  });

  it('generates summary for first deployment', () => {
    const result = makeResult(makeMetrics({ totalDeployments: 1 }));
    expect(result.summary).toContain('First deployment');
  });

  it('generates summary for serial deployer', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 42,
        averageMetadataConfidence: 60,
        deploymentSpanDays: 30,
      }),
    );
    expect(result.summary).toMatch(/Serial deployer/);
  });

  it('generates summary with wallet age', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 1,
        walletAgeDays: 3,
      }),
    );
    expect(result.summary).toMatch(/day/);
  });

  it('generates summary with risk info for high-risk tokens', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 4,
        highRiskTokens: 3,
        averageRisk: 80,
        averageMetadataConfidence: 40,
      }),
    );
    expect(result.summary).toContain('high-risk');
  });

  it('generates summary with reputation grade', () => {
    const result = makeResult(makeMetrics({ totalDeployments: 1 }));
    expect(result.summary).toMatch(/Reputation/);
  });

  it('clamps reputation score between 0 and 100', () => {
    const perfect = makeResult(
      makeMetrics({
        totalDeployments: 20,
        successfulTokens: 20,
        highRiskTokens: 0,
        averageRisk: 0,
        averageMetadataConfidence: 100,
        averageAiConfidence: 100,
        deploymentSpanDays: 100,
        walletAgeDays: 365,
      }),
    );
    expect(perfect.reputation).toBeLessThanOrEqual(100);

    const terrible = makeResult(
      makeMetrics({
        totalDeployments: 20,
        successfulTokens: 0,
        highRiskTokens: 20,
        averageRisk: 100,
        averageMetadataConfidence: 0,
        averageAiConfidence: 0,
        deploymentSpanDays: 0,
        walletAgeDays: 0,
      }),
    );
    expect(terrible.reputation).toBeGreaterThanOrEqual(0);
  });

  it('handles edge case with single deployment, no risk data', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 1,
        averageRisk: null,
        averageMetadataConfidence: 50,
      }),
    );
    expect(result.reputation).toBe(50);
    expect(result.grade).toBe('Average');
  });

  it('handles empty labels when totalDeployments is 0', () => {
    const result = makeResult(makeMetrics({ totalDeployments: 0 }));
    expect(result.labels).toHaveLength(0);
  });

  it('returns correct wallet address', () => {
    const result = makeResult(makeMetrics({ totalDeployments: 1 }));
    expect(result.wallet).toBe('0x1234567890abcdef1234567890abcdef12345678');
  });

  it('penalizes rapid deployments', () => {
    const rapid = makeResult(
      makeMetrics({
        totalDeployments: 5,
        averageMetadataConfidence: 50,
        deploymentSpanDays: 0.1,
      }),
    );
    const slow = makeResult(
      makeMetrics({
        totalDeployments: 5,
        averageMetadataConfidence: 50,
        deploymentSpanDays: 30,
      }),
    );
    expect(rapid.reputation).toBeLessThan(slow.reputation);
  });

  it('rewards high average AI confidence', () => {
    const highAi = makeResult(
      makeMetrics({
        totalDeployments: 5,
        averageAiConfidence: 90,
        averageMetadataConfidence: 50,
        deploymentSpanDays: 10,
      }),
    );
    const lowAi = makeResult(
      makeMetrics({
        totalDeployments: 5,
        averageAiConfidence: 10,
        averageMetadataConfidence: 50,
        deploymentSpanDays: 10,
      }),
    );
    expect(highAi.reputation).toBeGreaterThan(lowAi.reputation);
  });

  it('penalizes B20 tokens in reputation', () => {
    const withB20 = makeResult(
      makeMetrics({
        totalDeployments: 3,
        b20Tokens: 2,
        averageMetadataConfidence: 50,
      }),
    );
    const withoutB20 = makeResult(
      makeMetrics({
        totalDeployments: 3,
        b20Tokens: 0,
        averageMetadataConfidence: 50,
      }),
    );
    expect(withB20.reputation).toBeLessThanOrEqual(withoutB20.reputation);
  });

  it('handles walletAgeDays null correctly', () => {
    const result = makeResult(
      makeMetrics({
        totalDeployments: 1,
        walletAgeDays: null,
      }),
    );
    expect(result.walletAgeDays).toBeNull();
    expect(result.summary).not.toContain('day');
  });

  it('generates correct firstSeen and lastSeen dates', () => {
    const firstSeen = new Date('2026-01-01');
    const lastSeen = new Date('2026-07-20');
    const metrics: WalletMetrics = {
      totalDeployments: 3,
      successfulTokens: 1,
      highRiskTokens: 0,
      b20Tokens: 0,
      averageRisk: 30,
      averageMetadataConfidence: 60,
      averageAiConfidence: 40,
      walletAgeDays: 200,
      deploymentSpanDays: 200,
    };
    const result = analyzeWallet('0xabc', metrics, firstSeen, lastSeen);
    expect(result.firstSeen).toBe('2026-01-01T00:00:00.000Z');
    expect(result.lastSeen).toBe('2026-07-20T00:00:00.000Z');
  });
});
