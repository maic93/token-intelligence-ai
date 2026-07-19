import { describe, it, expect } from 'vitest';
import { sanitizeString, validateTokenMetadata } from '../erc20-validator.js';

describe('sanitizeString', () => {
  it('trims whitespace', () => {
    expect(sanitizeString('  foo  ')).toBe('foo');
  });

  it('removes null bytes', () => {
    expect(sanitizeString('foo\x00bar')).toBe('foobar');
  });

  it('removes control characters', () => {
    expect(sanitizeString('foo\tbar')).toBe('foobar');
  });

  it('removes zero-width characters', () => {
    expect(sanitizeString('foo\u200Bbar')).toBe('foobar');
    expect(sanitizeString('foo\uFEFFbar')).toBe('foobar');
  });

  it('NFKC normalizes unicode', () => {
    expect(sanitizeString('\uFF2E\uFF33\uFF23')).toBe('NSC');
  });

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('handles whitespace-only string', () => {
    expect(sanitizeString('   ')).toBe('');
  });

  it('preserves valid emoji', () => {
    expect(sanitizeString('Token \u{1F600}')).toBe('Token \u{1F600}');
  });
});

describe('validateTokenMetadata', () => {
  it('accepts valid ERC-20 metadata', () => {
    const result = validateTokenMetadata({
      name: 'Test Token',
      symbol: 'TEST',
      decimals: 18,
      totalSupply: '1000000000000000000',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects name with lone surrogate (invalid UTF-16)', () => {
    const result = validateTokenMetadata({
      name: 'Test\uD800Token',
      symbol: 'TEST',
      decimals: 18,
      totalSupply: '1000',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects name with null bytes', () => {
    const result = validateTokenMetadata({
      name: 'Test\x00Token',
      symbol: 'TEST',
      decimals: 18,
      totalSupply: '1000',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects whitespace-only name', () => {
    const result = validateTokenMetadata({
      name: '   ',
      symbol: 'TEST',
      decimals: 18,
      totalSupply: '1000',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects name longer than 128 chars', () => {
    const result = validateTokenMetadata({
      name: 'A'.repeat(129),
      symbol: 'TEST',
      decimals: 18,
      totalSupply: '1000',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects symbol longer than 32 chars', () => {
    const result = validateTokenMetadata({
      name: 'Test',
      symbol: 'A'.repeat(33),
      decimals: 18,
      totalSupply: '1000',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects decimals out of range (< 0)', () => {
    const result = validateTokenMetadata({
      name: 'Test',
      symbol: 'TEST',
      decimals: -1,
      totalSupply: '1000',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects decimals out of range (> 36)', () => {
    const result = validateTokenMetadata({
      name: 'Test',
      symbol: 'TEST',
      decimals: 37,
      totalSupply: '1000',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects non-numeric totalSupply', () => {
    const result = validateTokenMetadata({
      name: 'Test',
      symbol: 'TEST',
      decimals: 18,
      totalSupply: 'not-a-number',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects negative totalSupply', () => {
    const result = validateTokenMetadata({
      name: 'Test',
      symbol: 'TEST',
      decimals: 18,
      totalSupply: '-1000',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects mostly binary metadata', () => {
    const result = validateTokenMetadata({
      name: '\x00\x01\x02\x03\x04\x05\x06\x07',
      symbol: '\x00\x01\x02',
      decimals: 0,
      totalSupply: '0',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects name with replacement character', () => {
    const result = validateTokenMetadata({
      name: 'Test\uFFFD Token',
      symbol: 'TEST',
      decimals: 18,
      totalSupply: '1000',
    });
    expect(result.valid).toBe(false);
  });

  it('accepts unicode and emoji names', () => {
    const result = validateTokenMetadata({
      name: '\u4123\u4137 Token \u{1F680}',
      symbol: 'TEST',
      decimals: 18,
      totalSupply: '1000',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects helper contract (tiny name, 0 decimals)', () => {
    const result = validateTokenMetadata({
      name: 'a',
      symbol: 'a',
      decimals: 0,
      totalSupply: '0',
    });
    expect(result.valid).toBe(false);
  });

  it('accepts edge case: max length name and symbol', () => {
    const result = validateTokenMetadata({
      name: 'A'.repeat(128),
      symbol: 'B'.repeat(32),
      decimals: 36,
      totalSupply: '1',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects totalSupply exceeding maximum', () => {
    const result = validateTokenMetadata({
      name: 'Test',
      symbol: 'TEST',
      decimals: 18,
      totalSupply:
        '10000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    });
    expect(result.valid).toBe(false);
  });
});
