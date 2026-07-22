import type { PrismaClient, Prisma } from '@prisma/client';

export interface CreateSignalInput {
  tokenId: string;
  signal: string;
  rating: string;
  headline: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  reasons: string[];
  recommendation: string;
  opportunityScore: number;
  riskScore: number;
  confidence: number;
}

export interface SignalData {
  id: string;
  tokenId: string;
  signal: string;
  rating: string;
  headline: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  reasons: string[];
  recommendation: string;
  opportunityScore: number;
  riskScore: number;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignalWithToken extends SignalData {
  token: {
    chain: string;
    contractAddress: string;
    name: string;
    symbol: string;
    deployer: string;
  };
}

export interface SignalStats {
  total: number;
  strongBuy: number;
  buy: number;
  watch: number;
  neutral: number;
  caution: number;
  highRisk: number;
  avoid: number;
  rugRisk: number;
  averageConfidence: number;
  averageOpportunityScore: number;
  averageRiskScore: number;
  highestOpportunity: { tokenId: string; score: number } | null;
  highestRisk: { tokenId: string; score: number } | null;
}

export interface ListSignalsOptions {
  signal?: string;
  rating?: string;
  minConfidence?: number;
  maxRisk?: number;
  minOpportunity?: number;
  fundingSource?: string;
  category?: string;
  chain?: string;
  smartMoneyGrade?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class SignalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertSignal(tokenId: string, input: CreateSignalInput): Promise<SignalData> {
    const data: Prisma.SignalCreateInput = {
      token: { connect: { id: tokenId } },
      signal: input.signal,
      rating: input.rating,
      headline: input.headline,
      summary: input.summary,
      strengths: input.strengths,
      weaknesses: input.weaknesses,
      reasons: input.reasons,
      recommendation: input.recommendation,
      opportunityScore: input.opportunityScore,
      riskScore: input.riskScore,
      confidence: input.confidence,
    };

    const existing = await this.prisma.signal.findUnique({ where: { tokenId } });
    if (existing) {
      return this.prisma.signal.update({
        where: { tokenId },
        data: {
          ...data,
          createdAt: existing.createdAt,
        },
      }) as unknown as SignalData;
    }
    return this.prisma.signal.create({ data }) as unknown as SignalData;
  }

  async getSignal(tokenId: string): Promise<SignalWithToken | null> {
    const signal = await this.prisma.signal.findUnique({
      where: { tokenId },
      include: {
        token: {
          select: { chain: true, contractAddress: true, name: true, symbol: true, deployer: true },
        },
      },
    });
    if (!signal) return null;
    return this.mapWithToken(signal);
  }

  async listSignals(
    options: ListSignalsOptions = {},
  ): Promise<{ items: SignalWithToken[]; total: number }> {
    const where: Prisma.SignalWhereInput = {};

    if (options.signal) where.signal = options.signal;
    if (options.rating) where.rating = options.rating;
    if (options.minConfidence !== undefined) where.confidence = { gte: options.minConfidence };
    if (options.maxRisk !== undefined) where.riskScore = { lte: options.maxRisk };
    if (options.minOpportunity !== undefined)
      where.opportunityScore = { gte: options.minOpportunity };

    if (options.search) {
      where.OR = [
        { headline: { contains: options.search, mode: 'insensitive' } },
        { recommendation: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.category || options.chain || options.fundingSource || options.smartMoneyGrade) {
      where.token = {} as Prisma.SignalWhereInput['token'];
      if (options.chain) (where.token as Record<string, string>).chain = options.chain;
      if (options.category) (where.token as Record<string, string>).aiCategory = options.category;
    }

    const [items, total] = await Promise.all([
      this.prisma.signal.findMany({
        where,
        include: {
          token: {
            select: {
              chain: true,
              contractAddress: true,
              name: true,
              symbol: true,
              deployer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit ?? 50,
        skip: options.offset ?? 0,
      }),
      this.prisma.signal.count({ where }),
    ]);

    return {
      items: items.map((s) => this.mapWithToken(s)),
      total,
    };
  }

  async getHighConviction(
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ items: SignalWithToken[]; total: number }> {
    const where: Prisma.SignalWhereInput = {
      rating: { in: ['STRONG_BUY', 'BUY'] },
      confidence: { gte: 60 },
    };
    const [items, total] = await Promise.all([
      this.prisma.signal.findMany({
        where,
        include: {
          token: {
            select: {
              chain: true,
              contractAddress: true,
              name: true,
              symbol: true,
              deployer: true,
            },
          },
        },
        orderBy: { opportunityScore: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.signal.count({ where }),
    ]);
    return { items: items.map((s) => this.mapWithToken(s)), total };
  }

  async getHighRisk(
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ items: SignalWithToken[]; total: number }> {
    const where: Prisma.SignalWhereInput = {
      rating: { in: ['HIGH_RISK', 'AVOID', 'RUG_RISK'] },
    };
    const [items, total] = await Promise.all([
      this.prisma.signal.findMany({
        where,
        include: {
          token: {
            select: {
              chain: true,
              contractAddress: true,
              name: true,
              symbol: true,
              deployer: true,
            },
          },
        },
        orderBy: { riskScore: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.signal.count({ where }),
    ]);
    return { items: items.map((s) => this.mapWithToken(s)), total };
  }

  async getWatchlist(
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ items: SignalWithToken[]; total: number }> {
    const where: Prisma.SignalWhereInput = {
      rating: { in: ['WATCH', 'NEUTRAL', 'CAUTION'] },
    };
    const [items, total] = await Promise.all([
      this.prisma.signal.findMany({
        where,
        include: {
          token: {
            select: {
              chain: true,
              contractAddress: true,
              name: true,
              symbol: true,
              deployer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.signal.count({ where }),
    ]);
    return { items: items.map((s) => this.mapWithToken(s)), total };
  }

  async getStatistics(): Promise<SignalStats> {
    const [total, groups, agg] = await Promise.all([
      this.prisma.signal.count(),
      this.prisma.signal.groupBy({
        by: ['rating'],
        _count: { rating: true },
      }),
      this.prisma.signal.aggregate({
        _avg: { confidence: true, opportunityScore: true, riskScore: true },
      }),
    ]);

    const ratingMap = new Map(groups.map((g) => [g.rating, g._count.rating]));

    const [highestOpp, highestRisk] = await Promise.all([
      this.prisma.signal.findFirst({
        orderBy: { opportunityScore: 'desc' },
        select: { tokenId: true, opportunityScore: true },
      }),
      this.prisma.signal.findFirst({
        orderBy: { riskScore: 'desc' },
        select: { tokenId: true, riskScore: true },
      }),
    ]);

    return {
      total,
      strongBuy: ratingMap.get('STRONG_BUY') ?? 0,
      buy: ratingMap.get('BUY') ?? 0,
      watch: ratingMap.get('WATCH') ?? 0,
      neutral: ratingMap.get('NEUTRAL') ?? 0,
      caution: ratingMap.get('CAUTION') ?? 0,
      highRisk: ratingMap.get('HIGH_RISK') ?? 0,
      avoid: ratingMap.get('AVOID') ?? 0,
      rugRisk: ratingMap.get('RUG_RISK') ?? 0,
      averageConfidence: Math.round(agg._avg.confidence ?? 0),
      averageOpportunityScore: Math.round(agg._avg.opportunityScore ?? 0),
      averageRiskScore: Math.round(agg._avg.riskScore ?? 0),
      highestOpportunity: highestOpp
        ? { tokenId: highestOpp.tokenId, score: highestOpp.opportunityScore }
        : null,
      highestRisk: highestRisk
        ? { tokenId: highestRisk.tokenId, score: highestRisk.riskScore }
        : null,
    };
  }

  private mapWithToken(s: Record<string, unknown>): SignalWithToken {
    const strengths =
      typeof s.strengths === 'string'
        ? JSON.parse(s.strengths as string)
        : (s.strengths as string[]);
    const weaknesses =
      typeof s.weaknesses === 'string'
        ? JSON.parse(s.weaknesses as string)
        : (s.weaknesses as string[]);
    const reasons =
      typeof s.reasons === 'string' ? JSON.parse(s.reasons as string) : (s.reasons as string[]);
    return {
      id: s.id as string,
      tokenId: s.tokenId as string,
      signal: s.signal as string,
      rating: s.rating as string,
      headline: s.headline as string,
      summary: s.summary as string,
      strengths,
      weaknesses,
      reasons,
      recommendation: s.recommendation as string,
      opportunityScore: s.opportunityScore as number,
      riskScore: s.riskScore as number,
      confidence: s.confidence as number,
      createdAt: s.createdAt as Date,
      updatedAt: s.updatedAt as Date,
      token: s.token as SignalWithToken['token'],
    };
  }
}
