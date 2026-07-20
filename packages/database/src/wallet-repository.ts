import { PrismaClient, Prisma } from '@prisma/client';

export interface WalletProfileData {
  wallet: string;
  walletAgeDays: number | null;
  firstSeen: string | null;
  lastSeen: string | null;
  totalDeployments: number;
  successfulTokens: number;
  highRiskTokens: number;
  b20Tokens: number;
  averageRisk: number | null;
  averageMetadataConfidence: number;
  averageAiConfidence: number;
  reputation: number;
  grade: string;
  labels: string[];
  summary: string;
  tokens: WalletTokenEntry[];
}

export interface WalletTokenEntry {
  contractAddress: string;
  chain: string;
  name: string;
  symbol: string;
  riskScore: number | null;
  riskLevel: string | null;
  isB20: boolean;
  b20Confidence: number;
  aiCategory: string;
  aiConfidence: number;
  blockTimestamp: string;
  discoveredAt: string;
}

export interface ListWalletsOptions {
  page?: number;
  limit?: number;
  grade?: string;
  label?: string;
  sort?: string;
  search?: string;
}

export interface WalletListResult {
  items: WalletProfileData[];
  total: number;
  page: number;
  limit: number;
}

export class WalletRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getWallet(wallet: string): Promise<WalletProfileData | null> {
    const profile = await this.prisma.walletProfile.findUnique({
      where: { wallet: wallet.toLowerCase() },
    });
    if (!profile) return null;

    return this.enrichProfile(profile);
  }

  async listWallets(options: ListWalletsOptions = {}): Promise<WalletListResult> {
    const { page = 1, limit = 20, grade, label, sort = 'reputation_desc', search } = options;

    const where: Prisma.WalletProfileWhereInput = {};

    if (grade) where.grade = grade;
    if (search) where.wallet = { contains: search.toLowerCase() };

    if (label) {
      where.labels = { array_contains: label };
    }

    const orderBy = this.buildOrderBy(sort);

    const [total, profiles] = await Promise.all([
      this.prisma.walletProfile.count({ where }),
      this.prisma.walletProfile.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const items = await Promise.all(profiles.map((p) => this.enrichProfile(p)));

    return { items, total, page, limit };
  }

  async updateWallet(
    wallet: string,
    data: {
      walletAgeDays: number | null;
      firstSeen: Date | null;
      lastSeen: Date | null;
      totalDeployments: number;
      successfulTokens: number;
      highRiskTokens: number;
      b20Tokens: number;
      averageRisk: number | null;
      averageMetadataConfidence: number;
      averageAiConfidence: number;
      reputation: number;
      grade: string;
      labels: string[];
      summary: string;
    },
  ): Promise<void> {
    const existing = await this.prisma.walletProfile.findUnique({
      where: { wallet: wallet.toLowerCase() },
    });

    if (existing) {
      await this.prisma.walletProfile.update({
        where: { wallet: wallet.toLowerCase() },
        data: {
          walletAgeDays: data.walletAgeDays,
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen,
          totalDeployments: data.totalDeployments,
          successfulTokens: data.successfulTokens,
          highRiskTokens: data.highRiskTokens,
          b20Tokens: data.b20Tokens,
          averageRisk: data.averageRisk,
          averageMetadataConfidence: data.averageMetadataConfidence,
          averageAiConfidence: data.averageAiConfidence,
          reputation: data.reputation,
          grade: data.grade,
          labels: data.labels,
          summary: data.summary,
        },
      });
    } else {
      await this.prisma.walletProfile.create({
        data: {
          wallet: wallet.toLowerCase(),
          walletAgeDays: data.walletAgeDays,
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen,
          totalDeployments: data.totalDeployments,
          successfulTokens: data.successfulTokens,
          highRiskTokens: data.highRiskTokens,
          b20Tokens: data.b20Tokens,
          averageRisk: data.averageRisk,
          averageMetadataConfidence: data.averageMetadataConfidence,
          averageAiConfidence: data.averageAiConfidence,
          reputation: data.reputation,
          grade: data.grade,
          labels: data.labels,
          summary: data.summary,
        },
      });
    }
  }

  async searchWallet(query: string): Promise<WalletProfileData[]> {
    const profiles = await this.prisma.walletProfile.findMany({
      where: {
        wallet: { contains: query.toLowerCase() },
      },
      take: 20,
      orderBy: { reputation: 'desc' },
    });

    return Promise.all(profiles.map((p) => this.enrichProfile(p)));
  }

  private buildOrderBy(
    sort: string,
  ): Prisma.WalletProfileOrderByWithRelationInput | Prisma.WalletProfileOrderByWithRelationInput[] {
    switch (sort) {
      case 'reputation_desc':
        return { reputation: 'desc' };
      case 'reputation_asc':
        return { reputation: 'asc' };
      case 'deployments_desc':
        return { totalDeployments: 'desc' };
      case 'deployments_asc':
        return { totalDeployments: 'asc' };
      case 'risk_desc':
        return { averageRisk: 'desc' };
      case 'risk_asc':
        return { averageRisk: 'asc' };
      case 'lastSeen_desc':
        return { lastSeen: 'desc' };
      case 'lastSeen_asc':
        return { lastSeen: 'asc' };
      default:
        return { reputation: 'desc' };
    }
  }

  private async enrichProfile(profile: {
    wallet: string;
    walletAgeDays: number | null;
    firstSeen: Date | null;
    lastSeen: Date | null;
    totalDeployments: number;
    successfulTokens: number;
    highRiskTokens: number;
    b20Tokens: number;
    averageRisk: number | null;
    averageMetadataConfidence: number;
    averageAiConfidence: number;
    reputation: number;
    grade: string;
    labels: Prisma.JsonValue;
    summary: string;
  }): Promise<WalletProfileData> {
    const tokens = await this.prisma.token.findMany({
      where: { deployer: profile.wallet },
      orderBy: { discoveredAt: 'desc' },
      take: 50,
      include: {
        analysis: { select: { riskScore: true, riskLevel: true } },
      },
    });

    return {
      wallet: profile.wallet,
      walletAgeDays: profile.walletAgeDays,
      firstSeen: profile.firstSeen?.toISOString() ?? null,
      lastSeen: profile.lastSeen?.toISOString() ?? null,
      totalDeployments: profile.totalDeployments,
      successfulTokens: profile.successfulTokens,
      highRiskTokens: profile.highRiskTokens,
      b20Tokens: profile.b20Tokens,
      averageRisk: profile.averageRisk,
      averageMetadataConfidence: Math.round(profile.averageMetadataConfidence),
      averageAiConfidence: Math.round(profile.averageAiConfidence),
      reputation: profile.reputation,
      grade: profile.grade,
      labels: (profile.labels as string[]) ?? [],
      summary: profile.summary,
      tokens: tokens.map((t) => ({
        contractAddress: t.contractAddress,
        chain: t.chain,
        name: t.name,
        symbol: t.symbol,
        riskScore:
          (t as typeof t & { analysis?: { riskScore: number; riskLevel: string } | null }).analysis
            ?.riskScore ?? null,
        riskLevel:
          (t as typeof t & { analysis?: { riskScore: number; riskLevel: string } | null }).analysis
            ?.riskLevel ?? null,
        isB20: t.isB20,
        b20Confidence: t.b20Confidence,
        aiCategory: t.aiCategory,
        aiConfidence: t.aiConfidence,
        blockTimestamp: t.blockTimestamp.toISOString(),
        discoveredAt: t.discoveredAt.toISOString(),
      })),
    };
  }
}
