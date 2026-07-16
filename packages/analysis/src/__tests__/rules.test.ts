import { describe, it, expect } from 'vitest';
import {
  evaluateMissingSymbol,
  evaluateMissingName,
  evaluateDecimalsRange,
  evaluateSupplyMissing,
  evaluateSupplyExceeds,
  evaluateNewDeployment,
  evaluateFuturePlaceholder,
} from '../rules.js';

describe('evaluateMissingSymbol', () => {
  it('passes when symbol exists', () => {
    const result = evaluateMissingSymbol('ETH');
    expect(result.passed).toBe(true);
    expect(result.penalty).toBe(0);
    expect(result.rule).toBe('missing_symbol');
  });

  it('fails when symbol is empty', () => {
    const result = evaluateMissingSymbol('');
    expect(result.passed).toBe(false);
    expect(result.penalty).toBe(20);
  });
});

describe('evaluateMissingName', () => {
  it('passes when name exists', () => {
    const result = evaluateMissingName('Ether');
    expect(result.passed).toBe(true);
    expect(result.penalty).toBe(0);
  });

  it('fails when name is empty', () => {
    const result = evaluateMissingName('');
    expect(result.passed).toBe(false);
    expect(result.penalty).toBe(15);
  });
});

describe('evaluateDecimalsRange', () => {
  it('passes for 0 decimals', () => {
    expect(evaluateDecimalsRange(0).passed).toBe(true);
  });

  it('passes for 18 decimals', () => {
    expect(evaluateDecimalsRange(18).passed).toBe(true);
  });

  it('fails for negative decimals', () => {
    const result = evaluateDecimalsRange(-1);
    expect(result.passed).toBe(false);
    expect(result.penalty).toBe(20);
  });

  it('fails for decimals over 18', () => {
    const result = evaluateDecimalsRange(19);
    expect(result.passed).toBe(false);
    expect(result.penalty).toBe(20);
  });
});

describe('evaluateSupplyMissing', () => {
  it('passes when supply exists', () => {
    expect(evaluateSupplyMissing('1000000').passed).toBe(true);
  });

  it('fails when supply is empty', () => {
    const result = evaluateSupplyMissing('');
    expect(result.passed).toBe(false);
    expect(result.penalty).toBe(10);
  });

  it('fails when supply is zero', () => {
    const result = evaluateSupplyMissing('0');
    expect(result.passed).toBe(false);
    expect(result.penalty).toBe(10);
  });
});

describe('evaluateSupplyExceeds', () => {
  it('passes for small supply', () => {
    expect(evaluateSupplyExceeds('1000000').passed).toBe(true);
  });

  it('passes for supply just under 1 quadrillion', () => {
    expect(evaluateSupplyExceeds('999999999999999').passed).toBe(true);
  });

  it('fails for supply over 1 quadrillion', () => {
    const result = evaluateSupplyExceeds('1000000000000001');
    expect(result.passed).toBe(false);
    expect(result.penalty).toBe(15);
  });

  it('fails for invalid supply string', () => {
    const result = evaluateSupplyExceeds('not-a-number');
    expect(result.passed).toBe(false);
    expect(result.penalty).toBe(15);
  });
});

describe('evaluateNewDeployment', () => {
  it('passes for old deployment', () => {
    const result = evaluateNewDeployment(0n, 1000n);
    expect(result.passed).toBe(true);
    expect(result.penalty).toBe(0);
  });

  it('fails for very new deployment', () => {
    const result = evaluateNewDeployment(900n, 999n);
    expect(result.passed).toBe(false);
    expect(result.penalty).toBe(15);
  });

  it('passes when block age is exactly 100', () => {
    const result = evaluateNewDeployment(0n, 100n);
    expect(result.passed).toBe(true);
  });
});

describe('evaluateFuturePlaceholder', () => {
  it('always passes with zero penalty', () => {
    const result = evaluateFuturePlaceholder();
    expect(result.passed).toBe(true);
    expect(result.penalty).toBe(0);
  });
});
