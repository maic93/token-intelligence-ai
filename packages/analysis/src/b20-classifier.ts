export interface B20Classification {
  isB20: boolean;
  confidence: number;
  reasons: string[];
}

const NAME_KEYWORDS: [RegExp, number, string][] = [
  [/\bB20\b/i, 30, 'name contains "B20"'],
  [/\bBase20\b/i, 25, 'name contains "Base20"'],
  [/\bBTC\b/i, 20, 'name contains "BTC"'],
  [/\bSATS\b/i, 20, 'name contains "SATS"'],
  [/\b(Ordinal|Ordinals)\b/i, 15, 'name contains "Ordinal"'],
  [/\bRune(s)?\b/i, 15, 'name contains "Rune"'],
  [/\bInscribe(d)?\b/i, 10, 'name contains "Inscribe"'],
  [/\bBlock\b/i, 5, 'name contains "Block"'],
  [/\bBitcoin\b/i, 15, 'name contains "Bitcoin"'],
];

const SYMBOL_KEYWORDS: [RegExp, number, string][] = [
  [/\bB20\b/i, 35, 'symbol matches B20'],
  [/\bSATS\b/i, 25, 'symbol matches SATS'],
  [/\bBTC\b/i, 25, 'symbol matches BTC'],
  [/\bRUNE\b/i, 20, 'symbol matches RUNE'],
];

export function classifyB20(token: {
  name: string;
  symbol: string;
  deployer: string;
  metadataConfidence: number;
  blockTimestamp: Date | string;
  getDeployerB20Count?: () => Promise<number>;
}): B20Classification {
  let score = 0;
  const reasons: string[] = [];

  const name = token.name || '';
  const symbol = token.symbol || '';

  for (const [pattern, weight, reason] of NAME_KEYWORDS) {
    if (pattern.test(name)) {
      score += weight;
      reasons.push(reason);
    }
  }

  for (const [pattern, weight, reason] of SYMBOL_KEYWORDS) {
    if (pattern.test(symbol)) {
      score += weight;
      reasons.push(reason);
    }
  }

  if (token.metadataConfidence >= 90) {
    score += 10;
    reasons.push('high metadata confidence');
  } else if (token.metadataConfidence >= 70) {
    score += 5;
    reasons.push('moderate metadata confidence');
  }

  const ageHours = (Date.now() - new Date(token.blockTimestamp).getTime()) / 3_600_000;
  if (ageHours < 24) {
    score += 10;
    reasons.push('recent deployment');
  }

  score = Math.min(100, Math.max(0, score));

  return {
    isB20: score >= 30,
    confidence: score,
    reasons,
  };
}
