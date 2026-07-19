export interface Erc20Metadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const MAX_NAME_LENGTH = 128;
const MAX_SYMBOL_LENGTH = 32;
const MAX_DECIMALS = 36;
const MIN_DECIMALS = 0;
const MAX_CONTROL_CHAR_RATIO = 0.25;
const MAX_TOTAL_SUPPLY = 10n ** 78n;

function containsNullBytes(s: string): boolean {
  return s.indexOf('\0') !== -1;
}

function containsReplacementChar(s: string): boolean {
  return s.indexOf('\uFFFD') !== -1;
}

function hasInvalidUtf8(s: string): boolean {
  try {
    encodeURIComponent(s);
    return false;
  } catch {
    return true;
  }
}

function countControlChars(s: string): number {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) count++;
  }
  return count;
}

function isMostlyBinary(s: string): boolean {
  let binary = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 0x20 || (code >= 0x7f && code < 0xa0)) binary++;
  }
  return s.length > 0 && binary / s.length > 0.5;
}

function isWhitespaceOnly(s: string): boolean {
  return s.trim().length === 0;
}

function removeControlChars(s: string): string {
  let result = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 0x20) continue;
    if (code === 0x7f) continue;
    if (code >= 0x200b && code <= 0x200d) continue;
    if (code === 0xfeff) continue;
    result += s.charAt(i);
  }
  return result;
}

export function sanitizeString(s: string): string {
  let result = removeControlChars(s);
  result = result.trim();
  return result.normalize('NFKC');
}

export function validateTokenMetadata(metadata: Erc20Metadata): ValidationResult {
  const { name, symbol, decimals, totalSupply } = metadata;

  if (typeof name !== 'string' || hasInvalidUtf8(name)) {
    return { valid: false, reason: 'invalid UTF8 in name' };
  }
  if (name.length === 0 || isWhitespaceOnly(name)) {
    return { valid: false, reason: 'empty name' };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, reason: 'name too long' };
  }
  if (containsNullBytes(name)) {
    return { valid: false, reason: 'NULL bytes in name' };
  }
  if (containsReplacementChar(name)) {
    return { valid: false, reason: 'replacement characters in name' };
  }
  const ctrlRatio = countControlChars(name) / name.length;
  if (ctrlRatio > MAX_CONTROL_CHAR_RATIO) {
    return { valid: false, reason: 'too many control characters in name' };
  }

  if (typeof symbol !== 'string' || hasInvalidUtf8(symbol)) {
    return { valid: false, reason: 'invalid UTF8 in symbol' };
  }
  if (symbol.length === 0 || isWhitespaceOnly(symbol)) {
    return { valid: false, reason: 'empty symbol' };
  }
  if (symbol.length > MAX_SYMBOL_LENGTH) {
    return { valid: false, reason: 'symbol too long' };
  }
  if (containsNullBytes(symbol)) {
    return { valid: false, reason: 'NULL bytes in symbol' };
  }
  if (isMostlyBinary(symbol)) {
    return { valid: false, reason: 'symbol is mostly binary' };
  }
  if (name.length <= 2 && symbol.length <= 2 && decimals === 0) {
    return { valid: false, reason: 'likely a helper contract' };
  }

  if (typeof decimals !== 'number' || isNaN(decimals) || !Number.isInteger(decimals)) {
    return { valid: false, reason: 'invalid decimals' };
  }
  if (decimals < MIN_DECIMALS || decimals > MAX_DECIMALS) {
    return { valid: false, reason: `decimals ${decimals} out of range` };
  }

  if (typeof totalSupply !== 'string') {
    return { valid: false, reason: 'invalid totalSupply type' };
  }
  try {
    const supply = BigInt(totalSupply);
    if (supply < 0n) {
      return { valid: false, reason: 'negative totalSupply' };
    }
    if (supply > MAX_TOTAL_SUPPLY) {
      return { valid: false, reason: 'totalSupply exceeds maximum' };
    }
  } catch {
    return { valid: false, reason: 'cannot parse totalSupply' };
  }

  return { valid: true };
}
