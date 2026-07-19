import { describe, it, expect } from 'vitest';
import { classifyB20 } from '../b20-classifier.js';

function makeToken(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test Token',
    symbol: 'TEST',
    deployer: '0x1234567890abcdef1234567890abcdef12345678',
    metadataConfidence: 100,
    blockTimestamp: new Date(),
    ...overrides,
  };
}

describe('classifyB20', () => {
  it('classifies token with B20 in name', () => {
    const result = classifyB20(makeToken({ name: 'B20 Token' }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(30);
    expect(result.reasons).toContain('name contains "B20"');
  });

  it('classifies token with Base20 in name', () => {
    const result = classifyB20(makeToken({ name: 'Base20 Token' }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(25);
  });

  it('classifies token with BTC in name', () => {
    const result = classifyB20(makeToken({ name: 'BTC Token' }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(20);
  });

  it('classifies token with SATS in symbol', () => {
    const result = classifyB20(makeToken({ name: 'Token', symbol: 'SATS' }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(25);
  });

  it('classifies token with B20 in symbol', () => {
    const result = classifyB20(makeToken({ name: 'Token', symbol: 'B20' }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(35);
  });

  it('classifies token with RUNE in symbol', () => {
    const result = classifyB20(makeToken({ name: 'Token', symbol: 'RUNE' }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(20);
  });

  it('classifies token with Ordinal in name', () => {
    const result = classifyB20(makeToken({ name: 'Ordinal Token' }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(15);
  });

  it('classifies token with Rune in name', () => {
    const result = classifyB20(makeToken({ name: 'Rune Token' }));
    expect(result.isB20).toBe(true);
  });

  it('classifies token with Inscribe in name', () => {
    const result = classifyB20(makeToken({ name: 'Inscribed Token' }));
    expect(result.isB20).toBe(true);
  });

  it('classifies token with Block in name and high metadata confidence', () => {
    const result = classifyB20(makeToken({ name: 'Block B20 Token' }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(35);
  });

  it('classifies token with Bitcoin in name', () => {
    const result = classifyB20(makeToken({ name: 'Bitcoin Token' }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(15);
  });

  it('gives higher score for multiple keywords', () => {
    const result = classifyB20(makeToken({ name: 'B20 Bitcoin', symbol: 'BTC' }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(75);
  });

  it('boosts score for high metadata confidence', () => {
    const result = classifyB20(makeToken({ name: 'B20 Token', metadataConfidence: 95 }));
    expect(result.confidence).toBeGreaterThanOrEqual(40);
  });

  it('boosts score for recent deployment', () => {
    const result = classifyB20(makeToken({ name: 'B20 Token', blockTimestamp: new Date() }));
    expect(result.confidence).toBeGreaterThanOrEqual(40);
  });

  it('returns isB20 false for unrelated token', () => {
    const result = classifyB20(
      makeToken({
        name: 'Random Token',
        symbol: 'RND',
        metadataConfidence: 0,
        blockTimestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      }),
    );
    expect(result.isB20).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it('includes reasons for each matching signal', () => {
    const result = classifyB20(makeToken({ name: 'B20 Token', symbol: 'BTC' }));
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    expect(result.reasons.some((r) => r.includes('B20'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('BTC'))).toBe(true);
  });

  it('caps confidence at 100', () => {
    const result = classifyB20(
      makeToken({
        name: 'B20 Base20 BTC SATS Ordinal Rune Inscribe Block Bitcoin',
        symbol: 'B20',
        metadataConfidence: 100,
        blockTimestamp: new Date(),
      }),
    );
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.isB20).toBe(true);
  });

  it('handles empty name and symbol with low metadata confidence', () => {
    const result = classifyB20(
      makeToken({
        name: '',
        symbol: '',
        metadataConfidence: 0,
        blockTimestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      }),
    );
    expect(result.isB20).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it('handles case-insensitive matching', () => {
    const result = classifyB20(makeToken({ name: 'b20 token' }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(30);
  });

  it('detects multiples of same keyword only once', () => {
    const result = classifyB20(makeToken({ name: 'B20 B20 B20' }));
    expect(result.confidence).toBeGreaterThanOrEqual(30);
    const b20Reasons = result.reasons.filter((r) => r.includes('B20'));
    expect(b20Reasons.length).toBe(1);
  });

  it('works with old deployment (no recency boost)', () => {
    const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const result = classifyB20(makeToken({ name: 'B20 Token', blockTimestamp: oldDate }));
    expect(result.isB20).toBe(true);
    expect(result.confidence).toBe(40);
    expect(result.reasons).not.toContain('recent deployment');
  });
});
