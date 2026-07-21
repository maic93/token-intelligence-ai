import { PrismaClient, Prisma } from '@prisma/client';

export interface SmartMoneyProfileData {
  wallet: string;
  score: number;
  grade: string;
  firstSeen: string | null;
  lastSeen: string | null;
  tokensCreated: number;
  averageRisk: number | null;
  averageMetadataConfidence: number;
  averageAIConfidence: number;
  successfulTokens: number;
  failedTokens: number;
  averageHoldTimeDays: number | null;
  winRate: number;
  labels: string[];
  summary: string;
  signals: string[];
}

export interface ListSmartMoneyOptions {
  page?: number;
  limit?: number;
  grade?: string;
  label?: string;
  minScore?: number;
  sort?: string;
}

export interface SmartMoneyListResult {
  items: SmartMoneyProfileData[];
  total: number;
  page: number;
  limit: number;
}

export class SmartMoneyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertProfile(
    wallet: string,
    data: {
      score: number;
      grade: string;
      firstSeen: Date | null;
      lastSeen: Date | null;
      tokensCreated: number;
      averageRisk: number | null;
      averageMetadataConfidence: number;
      averageAIConfidence: number;
      successfulTokens: number;
      failedTokens: number;
      averageHoldTimeDays: number | null;
      winRate: number;
      labels: string[];
      summary: string;
      signals?: string[];
    },
  ): Promise<void> {
    const w = wallet.toLowerCase();
    await this.prisma.smartMoneyProfile.upsert({
      where: { wallet: w },
      create: { wallet: w, ...data, signals: data.signals ?? [] },
      update: data,
    });
  }

  async getProfile(wallet: string): Promise<SmartMoneyProfileData | null> {
    const profile = await this.prisma.smartMoneyProfile.findUnique({
      where: { wallet: wallet.toLowerCase() },
    });
    if (!profile) return null;
    return this.mapProfile(profile);
  }

  async listTopWallets(limit: number = 20): Promise<SmartMoneyProfileData[]> {
    const profiles = await this.prisma.smartMoneyProfile.findMany({
      orderBy: { score: 'desc' },
      take: limit,
    });
    return profiles.map((p) => this.mapProfile(p));
  }

  async listNewest(limit: number = 20): Promise<SmartMoneyProfileData[]> {
    const profiles = await this.prisma.smartMoneyProfile.findMany({
      orderBy: { lastSeen: 'desc' },
      take: limit,
    });
    return profiles.map((p) => this.mapProfile(p));
  }

  async listByGrade(grade: string, limit: number = 20): Promise<SmartMoneyProfileData[]> {
    const profiles = await this.prisma.smartMoneyProfile.findMany({
      where: { grade },
      orderBy: { score: 'desc' },
      take: limit,
    });
    return profiles.map((p) => this.mapProfile(p));
  }

  async listWallets(options: ListSmartMoneyOptions = {}): Promise<SmartMoneyListResult> {
    const { page = 1, limit = 20, grade, label, minScore, sort = 'score_desc' } = options;

    const where: Prisma.SmartMoneyProfileWhereInput = {};

    if (grade) where.grade = grade;
    if (label) where.labels = { array_contains: label };
    if (minScore !== undefined) where.score = { gte: minScore };

    const orderBy = this.buildOrderBy(sort);

    const [total, profiles] = await Promise.all([
      this.prisma.smartMoneyProfile.count({ where }),
      this.prisma.smartMoneyProfile.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: profiles.map((p) => this.mapProfile(p)),
      total,
      page,
      limit,
    };
  }

  async overview(): Promise<{
    total: number;
    averageScore: number;
    eliteCount: number;
    professionalCount: number;
    experiencedCount: number;
    averageCount: number;
    speculativeCount: number;
    dangerousCount: number;
    averageWinRate: number;
  }> {
    const [total, all, elite, professional, experienced, avg, speculative, dangerous] =
      await Promise.all([
        this.prisma.smartMoneyProfile.count(),
        this.prisma.smartMoneyProfile.findMany({ select: { score: true, winRate: true } }),
        this.prisma.smartMoneyProfile.count({ where: { grade: 'Elite' } }),
        this.prisma.smartMoneyProfile.count({ where: { grade: 'Professional' } }),
        this.prisma.smartMoneyProfile.count({ where: { grade: 'Experienced' } }),
        this.prisma.smartMoneyProfile.count({ where: { grade: 'Average' } }),
        this.prisma.smartMoneyProfile.count({ where: { grade: 'Speculative' } }),
        this.prisma.smartMoneyProfile.count({ where: { grade: 'Dangerous' } }),
      ]);

    const avgScore =
      all.length > 0
        ? Math.round((all.reduce((s, p) => s + p.score, 0) / all.length) * 10) / 10
        : 0;
    const avgWinRate =
      all.length > 0
        ? Math.round((all.reduce((s, p) => s + p.winRate, 0) / all.length) * 10) / 10
        : 0;

    return {
      total,
      averageScore: avgScore,
      eliteCount: elite,
      professionalCount: professional,
      experiencedCount: experienced,
      averageCount: avg,
      speculativeCount: speculative,
      dangerousCount: dangerous,
      averageWinRate: avgWinRate,
    };
  }

  private buildOrderBy(
    sort: string,
  ):
    | Prisma.SmartMoneyProfileOrderByWithRelationInput
    | Prisma.SmartMoneyProfileOrderByWithRelationInput[] {
    switch (sort) {
      case 'score_desc':
        return { score: 'desc' };
      case 'score_asc':
        return { score: 'asc' };
      case 'deployments':
        return { tokensCreated: 'desc' };
      case 'recent':
        return { lastSeen: 'desc' };
      case 'win_rate':
        return { winRate: 'desc' };
      default:
        return { score: 'desc' };
    }
  }

  private mapProfile(profile: {
    wallet: string;
    score: number;
    grade: string;
    firstSeen: Date | null;
    lastSeen: Date | null;
    tokensCreated: number;
    averageRisk: number | null;
    averageMetadataConfidence: number;
    averageAIConfidence: number;
    successfulTokens: number;
    failedTokens: number;
    averageHoldTimeDays: number | null;
    winRate: number;
    labels: Prisma.JsonValue;
    summary: string;
    signals: Prisma.JsonValue;
  }): SmartMoneyProfileData {
    return {
      wallet: profile.wallet,
      score: profile.score,
      grade: profile.grade,
      firstSeen: profile.firstSeen?.toISOString() ?? null,
      lastSeen: profile.lastSeen?.toISOString() ?? null,
      tokensCreated: profile.tokensCreated,
      averageRisk: profile.averageRisk,
      averageMetadataConfidence: Math.round(profile.averageMetadataConfidence),
      averageAIConfidence: Math.round(profile.averageAIConfidence),
      successfulTokens: profile.successfulTokens,
      failedTokens: profile.failedTokens,
      averageHoldTimeDays: profile.averageHoldTimeDays,
      winRate: profile.winRate,
      labels: (profile.labels as string[]) ?? [],
      summary: profile.summary,
      signals: (profile.signals as string[]) ?? [],
    };
  }
}
