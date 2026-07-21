import { describe, it, expect } from 'vitest';
import { calculateSmartMoneyScore, calculateGrade } from '../smart-money.js';
import type { SmartMoneyInput } from '../smart-money.js';

function baseInput(overrides: Partial<SmartMoneyInput> = {}): SmartMoneyInput {
  return {
    wallet: '0xabc123',
    tokensCreated: 10,
    successfulTokens: 8,
    failedTokens: 1,
    highRiskTokens: 1,
    averageRisk: 25,
    averageMetadataConfidence: 85,
    averageAIConfidence: 78,
    reputation: 75,
    walletAgeDays: 180,
    deploymentSpanDays: 120,
    b20Count: 0,
    chains: ['base'],
    firstSeen: new Date('2025-01-01'),
    lastSeen: new Date('2025-06-15'),
    ...overrides,
  };
}

describe('calculateGrade', () => {
  it('returns Elite for score >= 90', () => expect(calculateGrade(90)).toBe('Elite'));
  it('returns Elite for score 100', () => expect(calculateGrade(100)).toBe('Elite'));
  it('returns Professional for score 70-89', () => {
    expect(calculateGrade(70)).toBe('Professional');
    expect(calculateGrade(89)).toBe('Professional');
  });
  it('returns Experienced for score 50-69', () => {
    expect(calculateGrade(50)).toBe('Experienced');
    expect(calculateGrade(69)).toBe('Experienced');
  });
  it('returns Average for score 30-49', () => {
    expect(calculateGrade(30)).toBe('Average');
    expect(calculateGrade(49)).toBe('Average');
  });
  it('returns Speculative for score 15-29', () => {
    expect(calculateGrade(15)).toBe('Speculative');
    expect(calculateGrade(29)).toBe('Speculative');
  });
  it('returns Dangerous for score < 15', () => {
    expect(calculateGrade(0)).toBe('Dangerous');
    expect(calculateGrade(14)).toBe('Dangerous');
  });
});

describe('calculateSmartMoneyScore', () => {
  it('returns a deterministic result for same input', () => {
    const a = calculateSmartMoneyScore(baseInput());
    const b = calculateSmartMoneyScore(baseInput());
    expect(a.score).toBe(b.score);
    expect(a.grade).toBe(b.grade);
    expect(a.labels).toEqual(b.labels);
    expect(a.reasons).toEqual(b.reasons);
  });

  it('returns wallet address in lowercase', () => {
    const r = calculateSmartMoneyScore(baseInput({ wallet: '0xABC123' }));
    expect(r.wallet).toBe('0xabc123');
  });

  it('returns score between 0 and 100', () => {
    const r = calculateSmartMoneyScore(baseInput());
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('returns zero win rate for no tokens', () => {
    const r = calculateSmartMoneyScore(baseInput({ tokensCreated: 0, successfulTokens: 0 }));
    expect(r.winRate).toBe(0);
  });

  it('scores an empty wallet at 0', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        tokensCreated: 0,
        successfulTokens: 0,
        failedTokens: 0,
        highRiskTokens: 0,
        averageRisk: null,
        reputation: 0,
        walletAgeDays: null,
        deploymentSpanDays: 0,
        b20Count: 0,
        chains: [],
        averageMetadataConfidence: 0,
        averageAIConfidence: 0,
        firstSeen: null,
        lastSeen: null,
      }),
    );
    expect(r.score).toBe(0);
    expect(r.grade).toBe('Dangerous');
  });

  it('scores an elite wallet highly', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        tokensCreated: 50,
        successfulTokens: 45,
        failedTokens: 2,
        highRiskTokens: 2,
        averageRisk: 10,
        averageMetadataConfidence: 95,
        averageAIConfidence: 90,
        reputation: 90,
        walletAgeDays: 365,
        deploymentSpanDays: 300,
        b20Count: 0,
        chains: ['base', 'ethereum'],
      }),
    );
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(['Elite', 'Professional']).toContain(r.grade);
  });

  it('penalizes spam wallets heavily', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        tokensCreated: 20,
        successfulTokens: 0,
        failedTokens: 18,
        highRiskTokens: 15,
        averageRisk: 85,
        averageMetadataConfidence: 20,
        averageAIConfidence: 10,
        reputation: 10,
        walletAgeDays: 0.1,
        deploymentSpanDays: 0.05,
        b20Count: 15,
        chains: ['base'],
      }),
    );
    expect(r.score).toBeLessThan(30);
    expect(['Dangerous', 'Speculative']).toContain(r.grade);
  });

  it('awards multi-chain bonus', () => {
    const single = calculateSmartMoneyScore(baseInput({ chains: ['base'] }));
    const multi = calculateSmartMoneyScore(baseInput({ chains: ['base', 'ethereum', 'polygon'] }));
    expect(multi.score).toBeGreaterThan(single.score);
    expect(multi.labels).toContain('Multi-chain');
  });

  it('labels Early Adopter for new wallets', () => {
    const r = calculateSmartMoneyScore(baseInput({ walletAgeDays: 3 }));
    expect(r.labels).toContain('Early Adopter');
  });

  it('does not label Early Adopter for old wallets', () => {
    const r = calculateSmartMoneyScore(baseInput({ walletAgeDays: 100 }));
    expect(r.labels).not.toContain('Early Adopter');
  });

  it('labels Safe Creator for low risk', () => {
    const r = calculateSmartMoneyScore(baseInput({ averageRisk: 10, tokensCreated: 5 }));
    expect(r.labels).toContain('Safe Creator');
  });

  it('labels High Risk for high average risk', () => {
    const r = calculateSmartMoneyScore(baseInput({ averageRisk: 75 }));
    expect(r.labels).toContain('High Risk');
  });

  it('labels Serial Launcher for many tokens', () => {
    const r = calculateSmartMoneyScore(baseInput({ tokensCreated: 15 }));
    expect(r.labels).toContain('Serial Launcher');
  });

  it('labels Meme Specialist for high B20 ratio', () => {
    const r = calculateSmartMoneyScore(baseInput({ b20Count: 8, tokensCreated: 10 }));
    expect(r.labels).toContain('Meme Specialist');
  });

  it('labels Builder for high success rate and good score', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        successfulTokens: 20,
        tokensCreated: 22,
        reputation: 95,
        averageMetadataConfidence: 98,
        averageAIConfidence: 90,
        averageRisk: 5,
        walletAgeDays: 365,
        deploymentSpanDays: 300,
        chains: ['base', 'ethereum'],
      }),
    );
    expect(r.labels).toContain('Builder');
  });

  it('reasons include positive signals for good wallet', () => {
    const r = calculateSmartMoneyScore(baseInput());
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.reasons.some((s) => s.includes('reputation') || s.includes('launch'))).toBe(true);
  });

  it('reasons include negative signals for bad wallet', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        highRiskTokens: 10,
        tokensCreated: 15,
        averageRisk: 85,
      }),
    );
    expect(r.reasons.some((s) => s.includes('rug') || s.includes('risk'))).toBe(true);
  });

  it('penalizes very new wallets', () => {
    const young = calculateSmartMoneyScore(baseInput({ walletAgeDays: 0.5 }));
    const old = calculateSmartMoneyScore(baseInput({ walletAgeDays: 365 }));
    expect(young.reasons.some((s) => s.includes('new wallet'))).toBe(true);
    expect(young.score).toBeLessThan(old.score);
  });

  it('penalizes rapid deployments', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        tokensCreated: 10,
        deploymentSpanDays: 0.3,
      }),
    );
    expect(r.reasons.some((s) => s.includes('rapid'))).toBe(true);
  });

  it('penalizes mostly meme tokens', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        b20Count: 8,
        tokensCreated: 10,
      }),
    );
    expect(r.reasons.some((s) => s.includes('meme'))).toBe(true);
  });

  it('awards points for high reputation', () => {
    const low = calculateSmartMoneyScore(baseInput({ reputation: 30 }));
    const high = calculateSmartMoneyScore(baseInput({ reputation: 85 }));
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('awards points for long activity history', () => {
    const young = calculateSmartMoneyScore(baseInput({ walletAgeDays: 10 }));
    const old = calculateSmartMoneyScore(baseInput({ walletAgeDays: 200 }));
    expect(old.score).toBeGreaterThan(young.score);
  });

  it('awards points for successful launches', () => {
    const low = calculateSmartMoneyScore(baseInput({ successfulTokens: 1, tokensCreated: 10 }));
    const high = calculateSmartMoneyScore(baseInput({ successfulTokens: 9, tokensCreated: 10 }));
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('awards points for low average risk', () => {
    const high = calculateSmartMoneyScore(baseInput({ averageRisk: 10 }));
    const low = calculateSmartMoneyScore(baseInput({ averageRisk: 90 }));
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('awards points for high metadata confidence', () => {
    const low = calculateSmartMoneyScore(baseInput({ averageMetadataConfidence: 30 }));
    const high = calculateSmartMoneyScore(baseInput({ averageMetadataConfidence: 95 }));
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('awards points for high AI confidence', () => {
    const low = calculateSmartMoneyScore(baseInput({ averageAIConfidence: 20 }));
    const high = calculateSmartMoneyScore(baseInput({ averageAIConfidence: 85 }));
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('awards points for healthy deployment cadence', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        tokensCreated: 15,
        deploymentSpanDays: 60,
      }),
    );
    expect(r.reasons.some((s) => s.includes('cadence'))).toBe(true);
  });

  it('awards points for prolific creator', () => {
    const r = calculateSmartMoneyScore(baseInput({ tokensCreated: 25 }));
    expect(r.reasons.some((s) => s.includes('Prolific'))).toBe(true);
  });

  it('penalizes high failure rate', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        failedTokens: 8,
        tokensCreated: 10,
      }),
    );
    expect(r.reasons.some((s) => s.includes('failure'))).toBe(true);
  });

  it('generates summary for high-scoring wallet', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        tokensCreated: 100,
        successfulTokens: 95,
        failedTokens: 2,
        highRiskTokens: 1,
        reputation: 98,
        averageRisk: 5,
        averageMetadataConfidence: 99,
        averageAIConfidence: 95,
        walletAgeDays: 800,
        deploymentSpanDays: 700,
        chains: ['base', 'ethereum', 'polygon'],
      }),
    );
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.summary).toContain('Professional');
    expect(r.summary).toContain('Recommended');
  });

  it('generates summary for dangerous wallet', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        tokensCreated: 5,
        successfulTokens: 0,
        failedTokens: 5,
        highRiskTokens: 5,
        averageRisk: 95,
        walletAgeDays: 0.1,
      }),
    );
    expect(r.summary).toContain('High-risk');
    expect(r.summary).toContain('Avoid');
  });

  it('calculates winRate correctly', () => {
    const r = calculateSmartMoneyScore(baseInput({ successfulTokens: 7, tokensCreated: 10 }));
    expect(r.winRate).toBe(70);
  });

  it('handles edge case with all signals null', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        averageRisk: null,
        walletAgeDays: null,
        firstSeen: null,
        lastSeen: null,
      }),
    );
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('returns summary with score', () => {
    const r = calculateSmartMoneyScore(baseInput());
    expect(r.summary).toContain(`${r.score}/100`);
  });

  it('includes labels in summary', () => {
    const r = calculateSmartMoneyScore(
      baseInput({
        tokensCreated: 15,
        chains: ['base', 'polygon'],
      }),
    );
    if (r.labels.length > 0) {
      expect(r.summary).toContain('Labels:');
    }
  });
});
