import { describe, it, expect } from 'vitest';
import { calculateScore, getRiskLevel, generateExplanation } from '../scoring.js';
import type { RiskFactor } from '../types.js';

function factor(passed: boolean, penalty: number): RiskFactor {
  return { rule: 'test', passed, penalty, reason: 'test' };
}

describe('calculateScore', () => {
  it('returns 0 when all rules pass', () => {
    const factors = [factor(true, 0), factor(true, 0)];
    expect(calculateScore(factors)).toBe(0);
  });

  it('sums penalties from failed rules', () => {
    const factors = [factor(false, 20), factor(false, 15)];
    expect(calculateScore(factors)).toBe(35);
  });

  it('clamps to 0 minimum', () => {
    const factors = [factor(true, 0), factor(false, -10)];
    expect(calculateScore(factors)).toBe(0);
  });

  it('clamps to 100 maximum', () => {
    const factors = [factor(false, 80), factor(false, 30)];
    expect(calculateScore(factors)).toBe(100);
  });

  it('only sums penalties from failed rules', () => {
    const factors = [factor(true, 0), factor(false, 10), factor(false, 15)];
    expect(calculateScore(factors)).toBe(25);
  });

  it('handles empty factors', () => {
    expect(calculateScore([])).toBe(0);
  });
});

describe('getRiskLevel', () => {
  it('returns SAFE for 0-20', () => {
    expect(getRiskLevel(0)).toBe('SAFE');
    expect(getRiskLevel(20)).toBe('SAFE');
    expect(getRiskLevel(10)).toBe('SAFE');
  });

  it('returns LOW for 21-40', () => {
    expect(getRiskLevel(21)).toBe('LOW');
    expect(getRiskLevel(40)).toBe('LOW');
    expect(getRiskLevel(30)).toBe('LOW');
  });

  it('returns MEDIUM for 41-60', () => {
    expect(getRiskLevel(41)).toBe('MEDIUM');
    expect(getRiskLevel(60)).toBe('MEDIUM');
    expect(getRiskLevel(50)).toBe('MEDIUM');
  });

  it('returns HIGH for 61-80', () => {
    expect(getRiskLevel(61)).toBe('HIGH');
    expect(getRiskLevel(80)).toBe('HIGH');
    expect(getRiskLevel(70)).toBe('HIGH');
  });

  it('returns CRITICAL for 81-100', () => {
    expect(getRiskLevel(81)).toBe('CRITICAL');
    expect(getRiskLevel(100)).toBe('CRITICAL');
    expect(getRiskLevel(90)).toBe('CRITICAL');
  });
});

describe('generateExplanation', () => {
  it('returns safe message when all pass', () => {
    const factors = [factor(true, 0), factor(true, 0)];
    const msg = generateExplanation(factors, 0, 'SAFE');
    expect(msg).toContain('All checks passed');
  });

  it('includes failed reasons', () => {
    const factors = [
      { rule: 'missing_symbol', passed: false, penalty: 20, reason: 'missing symbol' },
    ];
    const msg = generateExplanation(factors, 20, 'SAFE');
    expect(msg).toContain('missing symbol');
    expect(msg).toContain('Score: 20/100');
  });
});
