import { describe, it, expect } from 'vitest';
import {
  getPeriodTimestamp,
  computeTrendUpdate,
  computeOverview,
  computeCategoryGrowth,
} from '../trend-engine.js';

describe('getPeriodTimestamp', () => {
  it('rounds down to the start of the current hour for hourly period', () => {
    const d = new Date('2025-06-15T14:37:42.000Z');
    const result = getPeriodTimestamp('hourly', d);
    expect(result.getTime()).toBe(new Date('2025-06-15T14:00:00.000Z').getTime());
  });

  it('rounds down to midnight for daily period', () => {
    const d = new Date('2025-06-15T14:37:42.000Z');
    const result = getPeriodTimestamp('daily', d);
    expect(result.getTime()).toBe(new Date('2025-06-15T00:00:00.000Z').getTime());
  });

  it('rounds down to Monday 00:00 for weekly period', () => {
    const d = new Date('2025-06-19T14:37:42.000Z');
    const result = getPeriodTimestamp('weekly', d);
    expect(result.getTime()).toBe(new Date('2025-06-16T00:00:00.000Z').getTime());
  });

  it('returns Sunday as start of Monday for weekly when date is Sunday', () => {
    const d = new Date('2025-06-22T10:00:00.000Z');
    const result = getPeriodTimestamp('weekly', d);
    expect(result.getTime()).toBe(new Date('2025-06-16T00:00:00.000Z').getTime());
  });

  it('returns Monday itself for weekly when date is Monday', () => {
    const d = new Date('2025-06-16T08:00:00.000Z');
    const result = getPeriodTimestamp('weekly', d);
    expect(result.getTime()).toBe(new Date('2025-06-16T00:00:00.000Z').getTime());
  });

  it('resets minutes and seconds for hourly period', () => {
    const d = new Date('2025-06-15T09:59:59.999Z');
    const result = getPeriodTimestamp('hourly', d);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('resets hours, minutes, seconds for daily period', () => {
    const d = new Date('2025-06-15T23:59:59.999Z');
    const result = getPeriodTimestamp('daily', d);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
  });

  it('defaults to current date when no date provided', () => {
    const now = new Date();
    const result = getPeriodTimestamp('hourly');
    expect(result.getTime()).toBeLessThanOrEqual(now.getTime());
  });

  it('handles midnight boundary for hourly', () => {
    const d = new Date('2025-06-15T00:00:00.000Z');
    const result = getPeriodTimestamp('hourly', d);
    expect(result.getTime()).toBe(d.getTime());
  });

  it('handles midnight boundary for daily', () => {
    const d = new Date('2025-06-15T00:00:00.000Z');
    const result = getPeriodTimestamp('daily', d);
    expect(result.getTime()).toBe(d.getTime());
  });

  it('handles year boundary for weekly', () => {
    const d = new Date('2026-01-01T12:00:00.000Z');
    const result = getPeriodTimestamp('weekly', d);
    expect(result.getUTCDay()).toBe(1);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
  });

  it('handles month boundary for daily', () => {
    const d = new Date('2025-07-01T05:30:00.000Z');
    const result = getPeriodTimestamp('daily', d);
    expect(result.getTime()).toBe(new Date('2025-07-01T00:00:00.000Z').getTime());
  });
});

describe('computeTrendUpdate', () => {
  const baseInput = {
    chain: 'base',
    deployer: '0xabc',
    aiCategory: 'defi',
    riskScore: 35,
    riskLevel: 'medium',
    metadataConfidence: 85,
    aiConfidence: 72,
    deployerReputation: 90,
    discoveredAt: new Date('2025-06-15T14:37:42.000Z'),
    isB20: false,
  };

  it('returns periods for hourly, daily, and weekly', () => {
    const result = computeTrendUpdate(baseInput);
    expect(result.periods).toEqual(['hourly', 'daily', 'weekly']);
  });

  it('returns the chain from input', () => {
    const result = computeTrendUpdate(baseInput);
    expect(result.chain).toBe('base');
  });

  it('returns the category from input', () => {
    const result = computeTrendUpdate(baseInput);
    expect(result.category).toBe('defi');
  });

  it('returns the deployer from input', () => {
    const result = computeTrendUpdate(baseInput);
    expect(result.deployer).toBe('0xabc');
  });

  it('handles different chain values', () => {
    const result = computeTrendUpdate({ ...baseInput, chain: 'polygon' });
    expect(result.chain).toBe('polygon');
  });

  it('handles empty deployer', () => {
    const result = computeTrendUpdate({ ...baseInput, deployer: '' });
    expect(result.deployer).toBe('');
  });

  it('handles B20 tokens', () => {
    const result = computeTrendUpdate({ ...baseInput, isB20: true });
    expect(result.chain).toBe('base');
  });

  it('handles null risk score', () => {
    const result = computeTrendUpdate({ ...baseInput, riskScore: null });
    expect(result.chain).toBe('base');
  });
});

describe('computeOverview', () => {
  it('returns zeros and nulls for empty hourly and daily data', () => {
    const result = computeOverview([], []);
    expect(result).toEqual({
      tokensToday: 0,
      tokensThisHour: 0,
      averageRisk: null,
      averageReputation: null,
      averageMetadata: null,
      averageAIConfidence: null,
    });
  });

  it('computes tokensThisHour from hourly data', () => {
    const hourly = [
      {
        tokensIndexed: 5,
        averageRisk: 30,
        averageMetadataConfidence: 80,
        averageAIConfidence: 70,
        uniqueDeployers: 2,
      },
      {
        tokensIndexed: 3,
        averageRisk: 40,
        averageMetadataConfidence: 90,
        averageAIConfidence: 75,
        uniqueDeployers: 1,
      },
    ];
    const result = computeOverview(hourly, []);
    expect(result.tokensThisHour).toBe(8);
  });

  it('computes tokensToday from daily data', () => {
    const daily = [
      {
        tokensIndexed: 10,
        averageRisk: 25,
        averageMetadataConfidence: 85,
        averageAIConfidence: 68,
        uniqueDeployers: 3,
      },
      {
        tokensIndexed: 20,
        averageRisk: 35,
        averageMetadataConfidence: 75,
        averageAIConfidence: 72,
        uniqueDeployers: 4,
      },
    ];
    const result = computeOverview([], daily);
    expect(result.tokensToday).toBe(30);
  });

  it('computes averageRisk from hourly data', () => {
    const hourly = [
      {
        tokensIndexed: 5,
        averageRisk: 20,
        averageMetadataConfidence: 80,
        averageAIConfidence: 70,
        uniqueDeployers: 2,
      },
      {
        tokensIndexed: 3,
        averageRisk: 40,
        averageMetadataConfidence: 90,
        averageAIConfidence: 75,
        uniqueDeployers: 1,
      },
    ];
    const result = computeOverview(hourly, []);
    expect(result.averageRisk).toBe(30);
  });

  it('computes averageMetadata from hourly data', () => {
    const hourly = [
      {
        tokensIndexed: 5,
        averageRisk: 30,
        averageMetadataConfidence: 80,
        averageAIConfidence: 70,
        uniqueDeployers: 2,
      },
      {
        tokensIndexed: 3,
        averageRisk: 40,
        averageMetadataConfidence: 90,
        averageAIConfidence: 75,
        uniqueDeployers: 1,
      },
    ];
    const result = computeOverview(hourly, []);
    expect(result.averageMetadata).toBe(85);
  });

  it('computes averageAIConfidence from hourly data', () => {
    const hourly = [
      {
        tokensIndexed: 5,
        averageRisk: 30,
        averageMetadataConfidence: 80,
        averageAIConfidence: 70,
        uniqueDeployers: 2,
      },
      {
        tokensIndexed: 3,
        averageRisk: 40,
        averageMetadataConfidence: 90,
        averageAIConfidence: 75,
        uniqueDeployers: 1,
      },
    ];
    const result = computeOverview(hourly, []);
    expect(result.averageAIConfidence).toBe(72.5);
  });

  it('handles null averageRisk values by filtering them out', () => {
    const hourly = [
      {
        tokensIndexed: 5,
        averageRisk: null,
        averageMetadataConfidence: 80,
        averageAIConfidence: 70,
        uniqueDeployers: 2,
      },
      {
        tokensIndexed: 3,
        averageRisk: 40,
        averageMetadataConfidence: 90,
        averageAIConfidence: 75,
        uniqueDeployers: 1,
      },
    ];
    const result = computeOverview(hourly, []);
    expect(result.averageRisk).toBe(40);
  });

  it('handles all null averages', () => {
    const hourly = [
      {
        tokensIndexed: 5,
        averageRisk: null,
        averageMetadataConfidence: null,
        averageAIConfidence: null,
        uniqueDeployers: 2,
      },
    ];
    const result = computeOverview(hourly, []);
    expect(result.averageRisk).toBeNull();
    expect(result.averageMetadata).toBeNull();
    expect(result.averageAIConfidence).toBeNull();
  });

  it('rounds averageMetadata to one decimal place', () => {
    const hourly = [
      {
        tokensIndexed: 5,
        averageRisk: 30,
        averageMetadataConfidence: 83,
        averageAIConfidence: 72,
        uniqueDeployers: 2,
      },
      {
        tokensIndexed: 3,
        averageRisk: 40,
        averageMetadataConfidence: 88,
        averageAIConfidence: 75,
        uniqueDeployers: 1,
      },
    ];
    const result = computeOverview(hourly, []);
    expect(result.averageMetadata).toBe(85.5);
  });

  it('rounds averageAIConfidence to one decimal place', () => {
    const hourly = [
      {
        tokensIndexed: 2,
        averageRisk: 30,
        averageMetadataConfidence: 80,
        averageAIConfidence: 71,
        uniqueDeployers: 1,
      },
      {
        tokensIndexed: 1,
        averageRisk: 40,
        averageMetadataConfidence: 90,
        averageAIConfidence: 74,
        uniqueDeployers: 2,
      },
    ];
    const result = computeOverview(hourly, []);
    expect(result.averageAIConfidence).toBe(72.5);
  });

  it('returns averageReputation as null', () => {
    const result = computeOverview([], []);
    expect(result.averageReputation).toBeNull();
  });
});

describe('computeCategoryGrowth', () => {
  const current = { tokensIndexed: 100, averageRisk: 30 };

  it('returns 0 when current has 0 tokens and no previous', () => {
    const result = computeCategoryGrowth({ tokensIndexed: 0, averageRisk: null }, null);
    expect(result).toBe(0);
  });

  it('returns 100 when current has tokens and no previous', () => {
    const result = computeCategoryGrowth(current, null);
    expect(result).toBe(100);
  });

  it('calculates positive growth percentage', () => {
    const previous = { tokensIndexed: 50, averageRisk: 25 };
    const result = computeCategoryGrowth(current, previous);
    expect(result).toBe(100);
  });

  it('calculates negative growth percentage', () => {
    const result = computeCategoryGrowth(
      { tokensIndexed: 30, averageRisk: 35 },
      { tokensIndexed: 100, averageRisk: 25 },
    );
    expect(result).toBe(-70);
  });

  it('returns 0 growth when tokens are equal', () => {
    const result = computeCategoryGrowth(
      { tokensIndexed: 50, averageRisk: 30 },
      { tokensIndexed: 50, averageRisk: 25 },
    );
    expect(result).toBe(0);
  });

  it('handles fractional growth percentages', () => {
    const result = computeCategoryGrowth(
      { tokensIndexed: 75, averageRisk: 30 },
      { tokensIndexed: 60, averageRisk: 25 },
    );
    expect(result).toBe(25);
  });

  it('returns 100 when previous is 0 and current is positive', () => {
    const result = computeCategoryGrowth(
      { tokensIndexed: 5, averageRisk: 30 },
      { tokensIndexed: 0, averageRisk: null },
    );
    expect(result).toBe(100);
  });

  it('handles large numbers', () => {
    const result = computeCategoryGrowth(
      { tokensIndexed: 1000000, averageRisk: 30 },
      { tokensIndexed: 500000, averageRisk: 25 },
    );
    expect(result).toBe(100);
  });

  it('handles very small fractions in growth', () => {
    const result = computeCategoryGrowth(
      { tokensIndexed: 101, averageRisk: 30 },
      { tokensIndexed: 100, averageRisk: 25 },
    );
    expect(result).toBe(1);
  });

  it('rounds growth to two decimal places', () => {
    const result = computeCategoryGrowth(
      { tokensIndexed: 150, averageRisk: 30 },
      { tokensIndexed: 70, averageRisk: 25 },
    );
    expect(result).toBe(114.29);
  });

  it('handles growth exceeding 1000%', () => {
    const result = computeCategoryGrowth(
      { tokensIndexed: 5000, averageRisk: 30 },
      { tokensIndexed: 10, averageRisk: 25 },
    );
    expect(result).toBe(49900);
  });
});
