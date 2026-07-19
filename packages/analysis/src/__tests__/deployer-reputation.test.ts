import { describe, it, expect } from 'vitest';
import { calculateDeployerReputation } from '../deployer-reputation.js';
import type { DeployerMetrics } from '../deployer-reputation.js';

function makeMetrics(overrides: Partial<DeployerMetrics> = {}): DeployerMetrics {
  return {
    totalTokens: 1,
    lowRiskTokens: 0,
    mediumRiskTokens: 0,
    highRiskTokens: 0,
    avgRiskScore: null,
    avgMetadataConfidence: 50,
    avgB20Confidence: 0,
    uniqueNames: 1,
    uniqueSymbols: 1,
    duplicateNames: 0,
    duplicateSymbols: 0,
    deploymentSpanDays: 0,
    ...overrides,
  };
}

describe('calculateDeployerReputation', () => {
  it('returns Excellent for high metadata confidence and many low-risk tokens', () => {
    const result = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 10,
        lowRiskTokens: 9,
        highRiskTokens: 0,
        avgRiskScore: 10,
        avgMetadataConfidence: 95,
        uniqueNames: 10,
        uniqueSymbols: 10,
        deploymentSpanDays: 60,
      }),
    );
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.grade).toBe('Excellent');
  });

  it('returns Good for moderately good metrics', () => {
    const result = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 3,
        lowRiskTokens: 2,
        highRiskTokens: 1,
        avgRiskScore: 45,
        avgMetadataConfidence: 70,
        uniqueNames: 2,
        uniqueSymbols: 3,
        deploymentSpanDays: 5,
      }),
    );
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThan(80);
    expect(result.grade).toBe('Good');
  });

  it('returns Average for mixed signals', () => {
    const result = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 3,
        lowRiskTokens: 1,
        mediumRiskTokens: 1,
        highRiskTokens: 1,
        avgRiskScore: 50,
        avgMetadataConfidence: 60,
        uniqueNames: 2,
        uniqueSymbols: 2,
        duplicateNames: 1,
        duplicateSymbols: 1,
        deploymentSpanDays: 2,
      }),
    );
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(60);
    expect(result.grade).toBe('Average');
  });

  it('returns Poor for many high-risk tokens', () => {
    const result = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 5,
        lowRiskTokens: 0,
        highRiskTokens: 2,
        avgRiskScore: 65,
        avgMetadataConfidence: 30,
        uniqueNames: 3,
        uniqueSymbols: 3,
        duplicateNames: 2,
        duplicateSymbols: 2,
        deploymentSpanDays: 2,
      }),
    );
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.score).toBeLessThan(40);
    expect(result.grade).toBe('Poor');
  });

  it('returns Dangerous for extremely bad metrics', () => {
    const result = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 8,
        lowRiskTokens: 0,
        highRiskTokens: 8,
        avgRiskScore: 95,
        avgMetadataConfidence: 10,
        uniqueNames: 1,
        uniqueSymbols: 1,
        duplicateNames: 7,
        duplicateSymbols: 7,
        deploymentSpanDays: 0.01,
      }),
    );
    expect(result.score).toBeLessThan(20);
    expect(result.grade).toBe('Dangerous');
  });

  it('penalizes duplicate symbols', () => {
    const withDupes = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 5,
        uniqueSymbols: 2,
        duplicateSymbols: 3,
        avgMetadataConfidence: 50,
      }),
    );
    const withoutDupes = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 5,
        uniqueSymbols: 5,
        duplicateSymbols: 0,
        avgMetadataConfidence: 50,
      }),
    );
    expect(withDupes.score).toBeLessThan(withoutDupes.score);
  });

  it('penalizes duplicate names', () => {
    const withDupes = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 5,
        uniqueNames: 2,
        duplicateNames: 3,
        avgMetadataConfidence: 50,
      }),
    );
    const withoutDupes = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 5,
        uniqueNames: 5,
        duplicateNames: 0,
        avgMetadataConfidence: 50,
      }),
    );
    expect(withDupes.score).toBeLessThan(withoutDupes.score);
  });

  it('penalizes rapid deployments', () => {
    const rapid = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 5,
        deploymentSpanDays: 0.1,
        avgMetadataConfidence: 50,
      }),
    );
    const slow = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 5,
        deploymentSpanDays: 30,
        avgMetadataConfidence: 50,
      }),
    );
    expect(rapid.score).toBeLessThan(slow.score);
  });

  it('rewards established deployers with long history', () => {
    const result = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 10,
        deploymentSpanDays: 60,
        avgMetadataConfidence: 80,
        lowRiskTokens: 8,
        avgRiskScore: 15,
      }),
    );
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.reasons).toContain('established deployer with long history');
  });

  it('penalizes majority high-risk tokens', () => {
    const result = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 5,
        highRiskTokens: 4,
        avgMetadataConfidence: 50,
      }),
    );
    expect(result.reasons).toContain('majority of tokens are high-risk');
  });

  it('penalizes many high-risk tokens', () => {
    const result = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 5,
        highRiskTokens: 2,
        avgMetadataConfidence: 50,
      }),
    );
    expect(result.reasons).toContain('many high-risk tokens');
  });

  it('rewards high metadata confidence', () => {
    const result = calculateDeployerReputation(makeMetrics({ avgMetadataConfidence: 95 }));
    expect(result.reasons).toContain('high metadata confidence');
  });

  it('penalizes low metadata confidence', () => {
    const result = calculateDeployerReputation(makeMetrics({ avgMetadataConfidence: 30 }));
    expect(result.reasons).toContain('low metadata confidence');
  });

  it('penalizes consistently high risk scores', () => {
    const result = calculateDeployerReputation(makeMetrics({ avgRiskScore: 85, totalTokens: 3 }));
    expect(result.reasons).toContain('consistently high risk scores');
  });

  it('clamps score between 0 and 100', () => {
    const perfect = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 20,
        lowRiskTokens: 20,
        avgRiskScore: 0,
        avgMetadataConfidence: 100,
        uniqueNames: 20,
        uniqueSymbols: 20,
        deploymentSpanDays: 100,
      }),
    );
    expect(perfect.score).toBeLessThanOrEqual(100);

    const terrible = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 20,
        highRiskTokens: 20,
        avgRiskScore: 100,
        avgMetadataConfidence: 0,
        uniqueNames: 1,
        uniqueSymbols: 1,
        duplicateNames: 19,
        duplicateSymbols: 19,
        deploymentSpanDays: 0,
      }),
    );
    expect(terrible.score).toBeGreaterThanOrEqual(0);
  });

  it('handles edge case with empty history (single token, no risk data)', () => {
    const result = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 1,
        avgRiskScore: null,
        avgMetadataConfidence: 50,
        uniqueNames: 1,
        uniqueSymbols: 1,
        deploymentSpanDays: 0,
      }),
    );
    expect(result.score).toBe(50);
    expect(result.grade).toBe('Average');
    expect(result.reasons).toHaveLength(0);
  });

  it('includes detailed reasons for each signal', () => {
    const result = calculateDeployerReputation(
      makeMetrics({
        totalTokens: 10,
        lowRiskTokens: 8,
        highRiskTokens: 1,
        avgRiskScore: 15,
        avgMetadataConfidence: 92,
        uniqueNames: 9,
        uniqueSymbols: 10,
        duplicateNames: 1,
        deploymentSpanDays: 45,
      }),
    );
    expect(result.reasons.length).toBeGreaterThanOrEqual(5);
    expect(result.reasons).toContain('high metadata confidence');
    expect(result.reasons).toContain('many successful low-risk tokens');
    expect(result.reasons).toContain('consistently low risk scores');
    expect(result.reasons).toContain('diverse token names');
    expect(result.reasons).toContain('established deployer with long history');
  });
});
