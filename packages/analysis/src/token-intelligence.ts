export type TokenCategory =
  'MEME' | 'AI' | 'DEFI' | 'GAMING' | 'NFT' | 'B20' | 'UTILITY' | 'UNKNOWN';
export type TokenRecommendation = 'WATCH' | 'SAFE' | 'CAUTION' | 'AVOID';

export interface TokenIntelligence {
  summary: string;
  category: TokenCategory;
  confidence: number;
  recommendation: TokenRecommendation;
  signals: string[];
}

export interface IntelligenceInput {
  name: string;
  symbol: string;
  riskScore: number | null;
  riskLevel: string | null;
  metadataConfidence: number;
  isB20: boolean;
  b20Confidence: number;
  deployerReputation: number;
  deployerGrade: string;
  totalSupply: string;
  decimals: number;
}

const NAME_KEYWORDS: [RegExp, TokenCategory, number, string][] = [
  [/\b(B20|Base20)\b/i, 'B20', 30, 'name matches B20 pattern'],
  [/\b(BTC|SATS|ORDI)\b/i, 'B20', 25, 'name matches Bitcoin-ecosystem pattern'],
  [
    /\b(Ordinal|Ordinals|Rune[s]?|Inscribe[d]?|Bitcoin)\b/i,
    'B20',
    15,
    'name matches ordinal/rune pattern',
  ],
  [
    /\b(DOGE|PEPE|SHIB|FLOKI|BONK|WOOF|MOON|FROG|SAMO|ELON)\b/i,
    'MEME',
    25,
    'name matches meme pattern',
  ],
  [
    /\b(CHAD|WOJAK|BRETT|SPX|DADDY|MOTHER|TURBO|COQ|MYRO|MICHI)\b/i,
    'MEME',
    20,
    'name matches meme pattern',
  ],
  [
    /\b(AI|GPT|AGENT|BRAIN|CHATGPT|NEURAL|DEEP|LEARN|LLM|TRANSFORMER)\b/i,
    'AI',
    30,
    'name matches AI pattern',
  ],
  [
    /\b(INTELLIGENCE|COGNITIVE|SMART|AUTOMAT|ROBOT|MACHINE)\b/i,
    'AI',
    20,
    'name matches AI pattern',
  ],
  [/\b(DEFI|SWAP|STAKE|FARM|YIELD|VAULT|LEND|BORROW)\b/i, 'DEFI', 25, 'name matches DeFi pattern'],
  [
    /\b(POOL|LIQUIDITY|DEX|PROTOCOL|COMPOUND|UNISWAP|CURVE)\b/i,
    'DEFI',
    20,
    'name matches DeFi pattern',
  ],
  [
    /\b(GAME|PLAY|GUILD|RAID|HERO|LEGEND|WORLD|ADVENTURE)\b/i,
    'GAMING',
    25,
    'name matches gaming pattern',
  ],
  [
    /\b(GAMEFI|RPG|MMO|P2E|PLAY2EARN|WARRIOR|DRAGON)\b/i,
    'GAMING',
    20,
    'name matches gaming pattern',
  ],
  [/\b(NFT|COLLECTION|ART|PIXEL|APE|PUNK)\b/i, 'NFT', 25, 'name matches NFT pattern'],
  [/\b(GENESIS|METAVERSE|DIGITAL|COLLECTIBLE)\b/i, 'NFT', 15, 'name matches NFT pattern'],
  [
    /\b(GOVERNANCE|VOTE|DAO|PROTOCOL|UTILITY|STAKING)\b/i,
    'UTILITY',
    25,
    'name matches utility pattern',
  ],
];

const SYMBOL_KEYWORDS: [RegExp, TokenCategory, number, string][] = [
  [/\b(B20|Base20)\b/i, 'B20', 35, 'symbol matches B20'],
  [/\b(BTC|SATS|ORDI|RUNE)\b/i, 'B20', 25, 'symbol matches Bitcoin-ecosystem'],
  [/\b(DOGE|PEPE|SHIB|FLOKI|BONK)\b/i, 'MEME', 25, 'symbol matches meme'],
  [/\bAI\b/i, 'AI', 35, 'symbol matches AI'],
  [/\bDEFI\b/i, 'DEFI', 30, 'symbol matches DeFi'],
  [/\b(NFT|GAME)\b/i, 'NFT', 20, 'symbol matches NFT/gaming'],
];

export function analyzeToken(token: IntelligenceInput): TokenIntelligence {
  const signals: string[] = [];
  const categoryScores = new Map<TokenCategory, number>();
  for (const cat of ['MEME', 'AI', 'DEFI', 'GAMING', 'NFT', 'B20', 'UTILITY'] as TokenCategory[]) {
    categoryScores.set(cat, 0);
  }

  const name = token.name || '';
  const symbol = token.symbol || '';

  for (const [pattern, cat, weight, reason] of NAME_KEYWORDS) {
    if (pattern.test(name)) {
      categoryScores.set(cat, (categoryScores.get(cat) ?? 0) + weight);
      signals.push(reason);
    }
  }

  for (const [pattern, cat, weight, reason] of SYMBOL_KEYWORDS) {
    if (pattern.test(symbol)) {
      categoryScores.set(cat, (categoryScores.get(cat) ?? 0) + weight);
      signals.push(reason);
    }
  }

  if (token.isB20 && token.b20Confidence >= 30) {
    categoryScores.set('B20', (categoryScores.get('B20') ?? 0) + 20);
    signals.push('confirmed B20 by B20 classifier');
  }

  if (token.deployerReputation >= 80) {
    signals.push('deployer has excellent reputation');
  } else if (token.deployerReputation <= 20 && token.deployerReputation > 0) {
    signals.push('deployer has poor reputation');
  }

  if (token.riskScore !== null) {
    if (token.riskScore <= 20) {
      signals.push('low risk score');
    } else if (token.riskScore >= 70) {
      signals.push('high risk score');
    }
  }

  if (token.metadataConfidence >= 90) {
    signals.push('high quality metadata');
  } else if (token.metadataConfidence < 50) {
    signals.push('low quality metadata');
  }

  const sorted = [...categoryScores.entries()].sort((a, b) => b[1] - a[1]);
  let category: TokenCategory;
  const topScore = sorted[0][1];
  const secondScore = sorted.length > 1 ? sorted[1][1] : 0;

  if (topScore === 0) {
    category = 'UNKNOWN';
  } else if (topScore === secondScore) {
    const b20Score = categoryScores.get('B20') ?? 0;
    if (b20Score >= topScore) category = 'B20';
    else category = sorted[0][0];
  } else {
    category = sorted[0][0];
  }

  let confidence: number;
  if (topScore >= 50) {
    confidence = Math.min(95, 50 + topScore);
  } else if (topScore >= 25) {
    confidence = Math.min(75, 30 + topScore);
  } else if (topScore > 0) {
    confidence = Math.min(50, 15 + topScore);
  } else {
    confidence = 0;
  }

  const riskScore = token.riskScore ?? 50;
  let recommendation: TokenRecommendation;
  if (category === 'B20' && token.isB20 && token.b20Confidence >= 70) {
    recommendation = 'WATCH';
  } else if (riskScore <= 20 && token.deployerReputation >= 60 && token.metadataConfidence >= 80) {
    recommendation = 'SAFE';
  } else if (riskScore >= 70 || token.deployerReputation <= 20 || token.metadataConfidence < 40) {
    recommendation = 'AVOID';
  } else if (riskScore >= 40 || token.deployerReputation <= 40) {
    recommendation = 'CAUTION';
  } else {
    recommendation = 'SAFE';
  }

  const summary = generateSummary(token, category, recommendation, riskScore);

  return { summary, category, confidence, recommendation, signals };
}

function generateSummary(
  token: IntelligenceInput,
  category: TokenCategory,
  recommendation: TokenRecommendation,
  riskScore: number,
): string {
  const parts: string[] = [];

  if (category === 'B20') {
    parts.push('Bitcoin-ecosystem token');
  } else if (category === 'MEME') {
    parts.push('Meme-themed token');
  } else if (category === 'AI') {
    parts.push('AI-themed token');
  } else if (category === 'DEFI') {
    parts.push('DeFi token');
  } else if (category === 'GAMING') {
    parts.push('Gaming token');
  } else if (category === 'NFT') {
    parts.push('NFT-related token');
  } else if (category === 'UTILITY') {
    parts.push('Utility token');
  } else {
    parts.push('Uncategorized token');
  }

  if (riskScore >= 70) {
    parts.push('with high risk characteristics');
  } else if (riskScore <= 20) {
    parts.push('with low risk characteristics');
  } else {
    parts.push('with moderate risk characteristics');
  }

  if (token.deployerReputation >= 80) {
    parts.push('created by a reputable deployer');
  } else if (token.deployerReputation <= 20 && token.deployerReputation > 0) {
    parts.push('created by a low-reputation deployer');
  }

  if (token.metadataConfidence >= 90) {
    parts.push('with verified metadata');
  } else if (token.metadataConfidence < 50) {
    parts.push('with unverified metadata');
  }

  if (category === 'MEME' && riskScore >= 40) {
    parts.push('likely a speculative meme launch');
  } else if (category === 'B20' && riskScore < 40) {
    parts.push('potentially legitimate B20 project');
  }

  let rec = '';
  switch (recommendation) {
    case 'WATCH':
      rec = 'Monitor for further development';
      break;
    case 'SAFE':
      rec = 'Low risk profile';
      break;
    case 'CAUTION':
      rec = 'Proceed with caution';
      break;
    case 'AVOID':
      rec = 'High risk — avoid';
      break;
  }

  return parts.join('. ') + '. ' + rec + '.';
}
