import { describe, it, expect } from 'vitest';
import { analyzeToken } from '../token-intelligence.js';
import type { IntelligenceInput } from '../token-intelligence.js';

function makeInput(overrides: Partial<IntelligenceInput> = {}): IntelligenceInput {
  return {
    name: 'Test Token',
    symbol: 'TEST',
    riskScore: 50,
    riskLevel: 'MEDIUM',
    metadataConfidence: 50,
    isB20: false,
    b20Confidence: 0,
    deployerReputation: 50,
    deployerGrade: 'Average',
    totalSupply: '1000000000000000000000000',
    decimals: 18,
    ...overrides,
  };
}

describe('analyzeToken', () => {
  it('classifies B20 tokens from name', () => {
    const result = analyzeToken(
      makeInput({ name: 'Bitcoin B20 Token', symbol: 'BTC20', isB20: true, b20Confidence: 75 }),
    );
    expect(result.category).toBe('B20');
    expect(result.confidence).toBeGreaterThanOrEqual(50);
    expect(result.recommendation).toBe('WATCH');
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('classifies MEME tokens from name', () => {
    const result = analyzeToken(makeInput({ name: 'Pepe The Frog', symbol: 'PEPE' }));
    expect(result.category).toBe('MEME');
    expect(result.confidence).toBeGreaterThan(25);
  });

  it('classifies AI tokens from name', () => {
    const result = analyzeToken(makeInput({ name: 'AI Agent Token', symbol: 'AIA' }));
    expect(result.category).toBe('AI');
    expect(result.confidence).toBeGreaterThan(25);
  });

  it('classifies DEFI tokens from name', () => {
    const result = analyzeToken(makeInput({ name: 'DeFi Swap Protocol', symbol: 'DSP' }));
    expect(result.category).toBe('DEFI');
    expect(result.confidence).toBeGreaterThan(25);
  });

  it('classifies GAMING tokens from name', () => {
    const result = analyzeToken(makeInput({ name: 'GameFi Hero Token', symbol: 'GHT' }));
    expect(result.category).toBe('GAMING');
    expect(result.confidence).toBeGreaterThan(25);
  });

  it('classifies NFT tokens from name', () => {
    const result = analyzeToken(makeInput({ name: 'Pixel Ape Collection', symbol: 'PIX' }));
    expect(result.category).toBe('NFT');
    expect(result.confidence).toBeGreaterThan(15);
  });

  it('classifies UTILITY tokens from name', () => {
    const result = analyzeToken(makeInput({ name: 'DAO Governance Token', symbol: 'GOV' }));
    expect(result.category).toBe('UTILITY');
    expect(result.confidence).toBeGreaterThan(25);
  });

  it('returns UNKNOWN for tokens with no keyword matches', () => {
    const result = analyzeToken(makeInput({ name: 'Xyzzy', symbol: 'XZ' }));
    expect(result.category).toBe('UNKNOWN');
    expect(result.confidence).toBe(0);
  });

  it('prioritizes B20 over other categories when B20 is confirmed by classifier', () => {
    const result = analyzeToken(
      makeInput({
        name: 'Super Token',
        symbol: 'ST',
        isB20: true,
        b20Confidence: 85,
      }),
    );
    expect(result.category).toBe('B20');
  });

  it('returns SAFE recommendation for low risk with good deployer', () => {
    const result = analyzeToken(
      makeInput({
        riskScore: 10,
        metadataConfidence: 95,
        deployerReputation: 90,
        deployerGrade: 'Excellent',
      }),
    );
    expect(result.recommendation).toBe('SAFE');
  });

  it('returns AVOID recommendation for high risk with poor deployer', () => {
    const result = analyzeToken(
      makeInput({
        riskScore: 85,
        metadataConfidence: 20,
        deployerReputation: 5,
        deployerGrade: 'Dangerous',
      }),
    );
    expect(result.recommendation).toBe('AVOID');
  });

  it('returns CAUTION recommendation for moderate risk', () => {
    const result = analyzeToken(
      makeInput({
        riskScore: 50,
        deployerReputation: 30,
      }),
    );
    expect(result.recommendation).toBe('CAUTION');
  });

  it('generates a human-readable summary with category info', () => {
    const result = analyzeToken(makeInput({ name: 'Pepe Frog', symbol: 'PEPE' }));
    expect(result.summary.length).toBeGreaterThan(10);
    expect(result.summary).toContain('.');
  });

  it('includes B20 confirmation signal when B20 classifier confirms', () => {
    const result = analyzeToken(makeInput({ isB20: true, b20Confidence: 50 }));
    expect(result.signals.some((s) => s.includes('B20') || s.includes('b20'))).toBe(true);
  });

  it('includes deployer reputation signals', () => {
    const good = analyzeToken(makeInput({ deployerReputation: 90 }));
    expect(good.signals.some((s) => s.includes('excellent'))).toBe(true);

    const bad = analyzeToken(makeInput({ deployerReputation: 10 }));
    expect(bad.signals.some((s) => s.includes('poor'))).toBe(true);
  });

  it('includes risk score signals', () => {
    const low = analyzeToken(makeInput({ riskScore: 10 }));
    expect(low.signals.some((s) => s.includes('low risk'))).toBe(true);

    const high = analyzeToken(makeInput({ riskScore: 85 }));
    expect(high.signals.some((s) => s.includes('high risk'))).toBe(true);
  });

  it('includes metadata confidence signals', () => {
    const high = analyzeToken(makeInput({ metadataConfidence: 95 }));
    expect(high.signals.some((s) => s.includes('high quality'))).toBe(true);

    const low = analyzeToken(makeInput({ metadataConfidence: 30 }));
    expect(low.signals.some((s) => s.includes('low quality'))).toBe(true);
  });

  it('handles null risk score gracefully', () => {
    const result = analyzeToken(makeInput({ riskScore: null, riskLevel: null }));
    expect(result.recommendation).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(10);
  });

  it('handles empty name and symbol', () => {
    const result = analyzeToken(makeInput({ name: '', symbol: '' }));
    expect(result.category).toBe('UNKNOWN');
    expect(result.confidence).toBe(0);
  });

  it('handles B20 recommendation correctly', () => {
    const result = analyzeToken(
      makeInput({
        name: 'Ordinals Token',
        symbol: 'ORDI',
        isB20: true,
        b20Confidence: 75,
      }),
    );
    expect(result.recommendation).toBe('WATCH');
  });

  it('B20 category is determined from symbol keyword matches', () => {
    const result = analyzeToken(makeInput({ name: 'Random', symbol: 'SATS' }));
    expect(result.category).toBe('B20');
  });

  it('confidence is max 95 for very strong signals', () => {
    const result = analyzeToken(
      makeInput({
        name: 'Pepe The Frog AI DeFi Gaming NFT',
        symbol: 'PEPE',
        isB20: true,
        b20Confidence: 90,
      }),
    );
    expect(result.confidence).toBeLessThanOrEqual(95);
  });
});
