import { describe, it, expect } from 'vitest';
import { classifyB20 } from '../b20-classifier.js';

function expectPositive(tokenName: string, classification: ReturnType<typeof classifyB20>) {
  const { isB20 } = classification;
  expect(isB20, getPositiveMsg(tokenName, classification)).toBe(true);
}

function expectNegative(tokenName: string, classification: ReturnType<typeof classifyB20>) {
  const { isB20 } = classification;
  expect(isB20, getNegativeMsg(tokenName, classification)).toBe(false);
}

function getPositiveMsg(name: string, r: ReturnType<typeof classifyB20>) {
  return [
    `"${name}" was NOT classified as B20.`,
    `  confidence: ${r.confidence}, reasons: [${r.reasons.join(', ')}]`,
    `  Score (${r.confidence}) < threshold (30).`,
  ].join('\n');
}

function getNegativeMsg(name: string, r: ReturnType<typeof classifyB20>) {
  return [
    `"${name}" WAS incorrectly classified as B20.`,
    `  confidence: ${r.confidence}, reasons: [${r.reasons.join(', ')}]`,
    `  Score (${r.confidence}) >= threshold (30).`,
  ].join('\n');
}

describe('B20 Classifier Integration', () => {
  describe('Must classify as B20', () => {
    const cases: [string, Record<string, unknown>][] = [
      ['Base20', { name: 'Base20 Token', symbol: 'BST' }],
      ['B20', { name: 'B20', symbol: 'B20' }],
      ['BTC', { name: 'BTC Token', symbol: 'BTC' }],
      ['SATS', { name: 'SATS Token', symbol: 'SATS' }],
      ['Rune', { name: 'Rune Token', symbol: 'RUNE' }],
    ];

    for (const [label, overrides] of cases) {
      it(label, () => {
        const token = {
          name: 'Test Token',
          symbol: 'TEST',
          deployer: '0x1234567890abcdef1234567890abcdef12345678',
          metadataConfidence: 100,
          blockTimestamp: new Date(),
          ...overrides,
        };
        expectPositive(label, classifyB20(token));
      });
    }
  });

  describe('Must NOT classify', () => {
    const cases: [string, Record<string, unknown>][] = [
      ['PEPE', { name: 'Pepe the Frog', symbol: 'PEPE' }],
      ['DOGE', { name: 'Dogecoin', symbol: 'DOGE' }],
      ['CAT', { name: 'Cat Token', symbol: 'CAT' }],
      ['Penguin', { name: 'Penguin Coin', symbol: 'PENGU' }],
      ['Messi', { name: 'Messi in Hood', symbol: 'MESSIHOOD' }],
    ];

    for (const [label, overrides] of cases) {
      it(label, () => {
        const token = {
          name: 'Test Token',
          symbol: 'TEST',
          deployer: '0x1234567890abcdef1234567890abcdef12345678',
          metadataConfidence: 100,
          blockTimestamp: new Date(),
          ...overrides,
        };
        expectNegative(label, classifyB20(token));
      });
    }
  });
});
