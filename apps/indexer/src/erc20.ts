import type { RpcClient } from './rpc.js';
import type { Erc20Metadata } from './erc20-validator.js';
import { sanitizeString } from './erc20-validator.js';

const SELECTOR_NAME = '0x06fdde03';
const SELECTOR_SYMBOL = '0x95d89b41';
const SELECTOR_DECIMALS = '0x313ce567';
const SELECTOR_TOTAL_SUPPLY = '0x18160ddd';

export interface DetectionResult {
  metadata: Erc20Metadata | null;
  metadataConfidence: number;
  reason?: string;
}

export async function detectErc20(
  rpc: RpcClient,
  contractAddress: string,
): Promise<DetectionResult> {
  const [symbolResult, decimalsResult, nameResult, supplyResult] = await Promise.allSettled([
    rpc.ethCall(contractAddress, SELECTOR_SYMBOL),
    rpc.ethCall(contractAddress, SELECTOR_DECIMALS),
    rpc.ethCall(contractAddress, SELECTOR_NAME, { retry: false }),
    rpc.ethCall(contractAddress, SELECTOR_TOTAL_SUPPLY, { retry: false }),
  ]);

  if (symbolResult.status === 'rejected') {
    return { metadata: null, metadataConfidence: 0, reason: 'symbol() call failed' };
  }
  if (decimalsResult.status === 'rejected') {
    return { metadata: null, metadataConfidence: 0, reason: 'decimals() call failed' };
  }
  if (nameResult.status === 'rejected') {
    return { metadata: null, metadataConfidence: 0, reason: 'name() call failed' };
  }
  if (supplyResult.status === 'rejected') {
    return { metadata: null, metadataConfidence: 0, reason: 'totalSupply() call failed' };
  }

  const symbolRaw = symbolResult.value;
  const decimalsRaw = decimalsResult.value;
  const nameRaw = nameResult.value;
  const supplyRaw = supplyResult.value;

  const symbol = decodeBytes32OrAbiString(symbolRaw);
  const decimals = decodeUint8FromAbi(decimalsRaw);
  const name = decodeBytes32OrAbiString(nameRaw);
  const totalSupplyParsed = decodeUint256FromAbi(supplyRaw);

  if (symbol === null) {
    return { metadata: null, metadataConfidence: 0, reason: 'invalid ABI in symbol' };
  }
  if (isNaN(decimals)) {
    return { metadata: null, metadataConfidence: 0, reason: 'invalid decimals' };
  }

  const sanitizedSymbol = sanitizeString(symbol);
  const sanitizedName = name ? sanitizeString(name) : null;

  const metadata: Erc20Metadata = {
    name: sanitizedName || sanitizedSymbol,
    symbol: sanitizedSymbol,
    decimals,
    totalSupply: totalSupplyParsed.toString(),
  };

  const confidence = computeConfidence({
    name: name !== null,
    totalSupply: totalSupplyParsed !== 0n,
    symbolBytes32:
      symbolRaw.length === 66 &&
      symbolRaw !== '0x0000000000000000000000000000000000000000000000000000000000000000',
    hasNameValue:
      nameRaw !== '0x0000000000000000000000000000000000000000000000000000000000000020' &&
      nameRaw !== '0x' &&
      nameRaw !== '0x0000000000000000000000000000000000000000000000000000000000000000',
  });

  return { metadata, metadataConfidence: confidence };
}

function computeConfidence(checks: {
  name: boolean;
  totalSupply: boolean;
  symbolBytes32: boolean;
  hasNameValue: boolean;
}): number {
  let score = 100;

  if (!checks.name) score -= 30;
  if (!checks.totalSupply) score -= 10;
  if (checks.symbolBytes32) score -= 5;
  if (!checks.hasNameValue) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function hexToBytes(hex: string): number[] {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.substring(i, i + 2), 16));
  }
  return bytes;
}

function decodeBytes32(hex: string): string | null {
  try {
    const bytes = hexToBytes(hex);
    const nonZero = bytes.filter((b) => b !== 0);
    if (nonZero.length === 0) return null;
    const decoded = new TextDecoder().decode(new Uint8Array(nonZero));
    if (decoded.indexOf('\uFFFD') !== -1) return null;
    return decoded;
  } catch {
    return null;
  }
}

function decodeAbiString(hex: string): string | null {
  try {
    if (hex.length < 130) return null;

    const offset = parseInt(hex.substring(2, 66), 16);
    if (offset < 0 || offset > 1024) return null;

    const dataStart = 2 + offset * 2;
    if (hex.length < dataStart + 64) return null;

    const length = parseInt(hex.substring(dataStart, dataStart + 64), 16);
    if (length < 1 || length > 256) return null;

    const dataHex = hex.substring(dataStart + 64, dataStart + 64 + length * 2);
    if (dataHex.length < length * 2) return null;

    const bytes = hexToBytes(dataHex);

    for (const b of bytes) {
      if (b === 0) return null;
    }

    const decoded = new TextDecoder().decode(new Uint8Array(bytes));
    if (decoded.indexOf('\uFFFD') !== -1) return null;

    return decoded;
  } catch {
    return null;
  }
}

function decodeBytes32OrAbiString(hex: string): string | null {
  if (hex.length === 66) {
    return decodeBytes32(hex);
  }
  return decodeAbiString(hex);
}

function decodeUint8FromAbi(hex: string): number {
  return parseInt(hex.slice(-2), 16);
}

function decodeUint256FromAbi(hex: string): bigint {
  try {
    return BigInt(hex);
  } catch {
    return 0n;
  }
}
