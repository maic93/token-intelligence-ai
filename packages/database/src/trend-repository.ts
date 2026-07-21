import { PrismaClient } from '@prisma/client';

export type TrendPeriod = 'hourly' | 'daily' | 'weekly';

function getPeriodTimestamp(period: TrendPeriod, date: Date = new Date()): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  if (period === 'hourly') return d;
  d.setHours(0, 0, 0, 0);
  if (period === 'daily') return d;
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

export class TrendRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertSnapshot(
    period: TrendPeriod,
    timestamp: Date,
    data: {
      tokensIndexed: number;
      highRiskTokens: number;
      averageRisk: number | null;
      averageMetadataConfidence: number | null;
      averageAIConfidence: number | null;
      uniqueDeployers: number;
      totalDeployments: number;
      averageSmartMoneyScore?: number | null;
      eliteWallets?: number;
      professionalWallets?: number;
      dangerousWallets?: number;
    },
  ): Promise<void> {
    const ts = getPeriodTimestamp(period, timestamp);
    await this.prisma.analyticsSnapshot.upsert({
      where: { period_timestamp: { period, timestamp: ts } },
      create: { period, timestamp: ts, ...data },
      update: data,
    });
  }

  async upsertCategoryTrend(
    category: string,
    period: TrendPeriod,
    timestamp: Date,
    data: {
      tokensIndexed: number;
      averageRisk: number | null;
      averageConfidence: number | null;
      uniqueDeployers: number;
    },
  ): Promise<void> {
    const ts = getPeriodTimestamp(period, timestamp);
    await this.prisma.categoryTrend.upsert({
      where: { category_period_timestamp: { category, period, timestamp: ts } },
      create: { category, period, timestamp: ts, ...data },
      update: data,
    });
  }

  async upsertChainTrend(
    chain: string,
    period: TrendPeriod,
    timestamp: Date,
    data: {
      tokensIndexed: number;
      averageRisk: number | null;
      averageMetadataConfidence: number | null;
      averageAIConfidence: number | null;
      averageDeployerReputation: number | null;
      uniqueDeployers: number;
    },
  ): Promise<void> {
    const ts = getPeriodTimestamp(period, timestamp);
    await this.prisma.chainTrend.upsert({
      where: { chain_period_timestamp: { chain, period, timestamp: ts } },
      create: { chain, period, timestamp: ts, ...data },
      update: data,
    });
  }

  async upsertDeployerTrend(
    wallet: string,
    period: TrendPeriod,
    timestamp: Date,
    data: {
      tokensIndexed: number;
      averageRisk: number | null;
      averageMetadataConfidence: number | null;
      averageAIConfidence: number | null;
      reputation: number;
    },
  ): Promise<void> {
    const ts = getPeriodTimestamp(period, timestamp);
    await this.prisma.deployerTrend.upsert({
      where: { wallet_period_timestamp: { wallet, period, timestamp: ts } },
      create: { wallet, period, timestamp: ts, ...data },
      update: data,
    });
  }

  async getSnapshots(
    period: TrendPeriod,
    limit: number = 48,
  ): Promise<
    {
      timestamp: Date;
      tokensIndexed: number;
      highRiskTokens: number;
      averageRisk: number | null;
      averageMetadataConfidence: number | null;
      averageAIConfidence: number | null;
      uniqueDeployers: number;
      totalDeployments: number;
    }[]
  > {
    const snapshots = await this.prisma.analyticsSnapshot.findMany({
      where: { period },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    return snapshots.reverse().map((s) => ({
      timestamp: s.timestamp,
      tokensIndexed: s.tokensIndexed,
      highRiskTokens: s.highRiskTokens,
      averageRisk: s.averageRisk,
      averageMetadataConfidence: s.averageMetadataConfidence,
      averageAIConfidence: s.averageAIConfidence,
      uniqueDeployers: s.uniqueDeployers,
      totalDeployments: s.totalDeployments,
    }));
  }

  async getCategoryTrends(
    category?: string,
    period: TrendPeriod = 'daily',
    limit: number = 7,
  ): Promise<
    {
      category: string;
      period: string;
      timestamp: Date;
      tokensIndexed: number;
      averageRisk: number | null;
      averageConfidence: number | null;
    }[]
  > {
    const where: Record<string, unknown> = { period };
    if (category) where.category = category;
    const trends = await this.prisma.categoryTrend.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit * 10,
    });
    return trends.reverse().map((t) => ({
      category: t.category,
      period: t.period,
      timestamp: t.timestamp,
      tokensIndexed: t.tokensIndexed,
      averageRisk: t.averageRisk,
      averageConfidence: t.averageConfidence,
    }));
  }

  async getChainTrends(
    chain?: string,
    period: TrendPeriod = 'daily',
    limit: number = 7,
  ): Promise<
    {
      chain: string;
      period: string;
      timestamp: Date;
      tokensIndexed: number;
      averageRisk: number | null;
      averageMetadataConfidence: number | null;
      averageDeployerReputation: number | null;
    }[]
  > {
    const where: Record<string, unknown> = { period };
    if (chain) where.chain = chain;
    const trends = await this.prisma.chainTrend.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit * 10,
    });
    return trends.reverse().map((t) => ({
      chain: t.chain,
      period: t.period,
      timestamp: t.timestamp,
      tokensIndexed: t.tokensIndexed,
      averageRisk: t.averageRisk,
      averageMetadataConfidence: t.averageMetadataConfidence,
      averageDeployerReputation: t.averageDeployerReputation,
    }));
  }

  async getDeployerTrends(
    wallet?: string,
    period: TrendPeriod = 'daily',
    limit: number = 20,
  ): Promise<
    {
      wallet: string;
      period: string;
      timestamp: Date;
      tokensIndexed: number;
      averageRisk: number | null;
      averageAIConfidence: number | null;
      reputation: number;
    }[]
  > {
    const where: Record<string, unknown> = { period };
    if (wallet) where.wallet = wallet;
    const trends = await this.prisma.deployerTrend.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit * 5,
    });
    return trends.reverse().map((t) => ({
      wallet: t.wallet,
      period: t.period,
      timestamp: t.timestamp,
      tokensIndexed: t.tokensIndexed,
      averageRisk: t.averageRisk,
      averageAIConfidence: t.averageAIConfidence,
      reputation: t.reputation,
    }));
  }

  async getLatestCategoryPeriod(): Promise<CategorySummary[]> {
    return this.getCategorySummaries();
  }

  async getCategorySummaries(): Promise<CategorySummary[]> {
    const now = getPeriodTimestamp('daily');
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = await this.prisma.categoryTrend.findMany({
      where: { period: 'daily', timestamp: now },
    });
    const week = await this.prisma.categoryTrend.findMany({
      where: { period: 'daily', timestamp: { gte: sevenDaysAgo } },
    });
    const categories = ['MEME', 'AI', 'DEFI', 'NFT', 'UTILITY', 'GAMING', 'B20', 'UNKNOWN'];
    return categories.map((cat) => {
      const tod = today.find((t) => t.category === cat);
      const wk = week.filter((w) => w.category === cat);
      const tokens7d = wk.reduce((s, w) => s + w.tokensIndexed, 0);
      return {
        category: cat,
        tokens24h: tod?.tokensIndexed ?? 0,
        tokens7d,
        averageRisk: tod?.averageRisk ?? null,
        averageConfidence: tod?.averageConfidence ?? null,
        growthPercent: 0,
      };
    });
  }

  async getTopTrendingTokens(limit: number = 20): Promise<
    {
      contractAddress: string;
      chain: string;
      name: string;
      symbol: string;
      aiConfidence: number;
      b20Confidence: number;
      metadataConfidence: number;
      riskScore: number | null;
      riskLevel: string | null;
      discoveredAt: Date;
      deployerReputation: number;
    }[]
  > {
    const tokens = await this.prisma.token.findMany({
      where: {
        discoveredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { discoveredAt: 'desc' },
      take: limit,
      include: {
        analysis: {
          select: { riskScore: true, riskLevel: true },
        },
      },
    });
    return tokens.map((t) => ({
      contractAddress: t.contractAddress,
      chain: t.chain,
      name: t.name,
      symbol: t.symbol,
      aiConfidence: t.aiConfidence,
      b20Confidence: t.b20Confidence,
      metadataConfidence: t.metadataConfidence,
      riskScore: t.analysis?.riskScore ?? null,
      riskLevel: t.analysis?.riskLevel ?? null,
      discoveredAt: t.discoveredAt,
      deployerReputation: t.deployerReputation,
    }));
  }

  async getTopDeployers(limit: number = 20): Promise<DeployerSummary[]> {
    const wallets = await this.prisma.walletProfile.findMany({
      orderBy: { totalDeployments: 'desc' },
      take: limit,
    });
    return wallets.map((w) => ({
      wallet: w.wallet,
      tokensIndexed: w.totalDeployments,
      averageRisk: w.averageRisk,
      averageMetadataConfidence: w.averageMetadataConfidence,
      averageAIConfidence: w.averageAiConfidence,
      reputation: w.reputation,
      grade: w.grade,
    }));
  }

  async getChainSummaries(): Promise<ChainSummary[]> {
    const now = getPeriodTimestamp('daily');
    const today = await this.prisma.chainTrend.findMany({
      where: { period: 'daily', timestamp: now },
    });
    const allChains = ['base', 'robinhood', 'ethereum', 'polygon'];
    return allChains.map((ch) => {
      const found = today.find((t) => t.chain === ch);
      return {
        chain: ch,
        tokensDay: found?.tokensIndexed ?? 0,
        averageRisk: found?.averageRisk ?? null,
        averageMetadataConfidence: found?.averageMetadataConfidence ?? null,
        averageDeployerReputation: found?.averageDeployerReputation ?? null,
        tokensHour: 0,
        averageMetadataQuality: found?.averageMetadataConfidence ?? null,
      };
    });
  }
}

interface CategorySummary {
  category: string;
  tokens24h: number;
  tokens7d: number;
  averageRisk: number | null;
  averageConfidence: number | null;
  growthPercent: number;
}

interface DeployerSummary {
  wallet: string;
  tokensIndexed: number;
  averageRisk: number | null;
  averageMetadataConfidence: number | null;
  averageAIConfidence: number | null;
  reputation: number;
  grade: string;
}

interface ChainSummary {
  chain: string;
  tokensDay: number;
  tokensHour: number;
  averageRisk: number | null;
  averageMetadataConfidence: number | null;
  averageDeployerReputation: number | null;
  averageMetadataQuality: number | null;
}
