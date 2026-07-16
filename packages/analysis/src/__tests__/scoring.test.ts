import { describe, it, expect } from 'vitest';
import { calculateScore, getRiskLevel, generateExplanation } from '../scoring.js';
import type { RiskFactor } from '../types.js';

function factor(passed: boolean, penalty: number): RiskFactor {
  return { rule: 'test', passed, penalty, reason: 'test' };
}

describe('calculateScore', () => {
  it('returns 100 when all rules pass', () => {
    const factors = [factor(true, 0), factor(true, 0)];
    expect(calculateScore(factors)).toBe(100);
  });

  it('subtracts penalties from 100', () => {
    const factors = [factor(false, 20), factor(false, 15)];
    expect(calculateScore(factors)).toBe(65);
  });

  it('clamps to 0 minimum', () => {
    const factors = [factor(false, 80), factor(false, 30)];
    expect(calculateScore(factors)).toBe(0);
  });

  it('only subtracts penalties from failed rules', () => {
    const factors = [factor(true, 0), factor(false, 10), factor(false, 15)];
    expect(calculateScore(factors)).toBe(75);
  });

  it('handles empty factors', () => {
    expect(calculateScore([])).toBe(100);
  });
});

describe('getRiskLevel', () => {
  it('returns very_safe for 90-100', () => {
    expect(getRiskLevel(90)).toBe('very_safe');
    expect(getRiskLevel(100)).toBe('very_safe');
    expect(getRiskLevel(95)).toBe('very_safe');
  });

  it('returns low for 70-89', () => {
    expect(getRiskLevel(70)).toBe('low');
    expect(getRiskLevel(89)).toBe('low');
    expect(getRiskLevel(80)).toBe('low');
  });

  it('returns medium for 50-69', () => {
    expect(getRiskLevel(50)).toBe('medium');
    expect(getRiskLevel(69)).toBe('medium');
    expect(getRiskLevel(60)).toBe('medium');
  });

  it('returns high for 30-49', () => {
    expect(getRiskLevel(30)).toBe('high');
    expect(getRiskLevel(49)).toBe('high');
    expect(getRiskLevel(40)).toBe('high');
  });

  it('returns critical for 0-29', () => {
    expect(getRiskLevel(0)).toBe('critical');
    expect(getRiskLevel(29)).toBe('critical');
    expect(getRiskLevel(15)).toBe('critical');
  });
});

describe('generateExplanation', () => {
  it('returns safe message when all pass', () => {
    const factors = [factor(true, 0), factor(true, 0)];
    const msg = generateExplanation(factors, 100, 'very_safe');
    expect(msg).toContain('All checks passed');
  });

  it('includes failed reasons', () => {
    const factors = [
      { rule: 'missing_symbol', passed: false, penalty: 20, reason: 'missing symbol' },
    ];
    const msg = generateExplanation(factors, 80, 'low');
    expect(msg).toContain('missing symbol');
    expect(msg).toContain('Score: 80/100');
  });
});
