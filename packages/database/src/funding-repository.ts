import { PrismaClient, Prisma } from '@prisma/client';

export interface FundingProfileData {
  wallet: string;
  fundedBy: string | null;
  fundingTxHash: string | null;
  fundingBlock: string | null;
  fundingTimestamp: string | null;
  fundingAmount: string | null;
  fundingCurrency: string;
  timeToDeploymentMinutes: number | null;
  fundingSourceType: string;
  fundingSourceLabel: string;
  clusterId: string | null;
  firstSeen: string | null;
}

export interface FundingClusterData {
  id: string;
  funderWallet: string;
  walletCount: number;
  deployments: number;
  successfulTokens: number;
  highRiskTokens: number;
  chains: string[];
  totalFunding: string;
  firstSeen: string | null;
  lastSeen: string | null;
}

export interface ListFundingOptions {
  page?: number;
  limit?: number;
  source?: string;
  cluster?: string;
  minAmount?: number;
  sort?: string;
}

export interface FundingListResult {
  items: FundingProfileData[];
  total: number;
  page: number;
  limit: number;
}

export class FundingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertFundingProfile(
    wallet: string,
    data: {
      fundedBy: string | null;
      fundingTxHash: string | null;
      fundingBlock: bigint | null;
      fundingTimestamp: Date | null;
      fundingAmount: string | null;
      fundingCurrency?: string;
      timeToDeploymentMinutes: number | null;
      fundingSourceType: string;
      clusterId: string | null;
      firstSeen: Date | null;
    },
  ): Promise<void> {
    const w = wallet.toLowerCase();
    await this.prisma.fundingProfile.upsert({
      where: { wallet: w },
      create: {
        wallet: w,
        fundedBy: data.fundedBy,
        fundingTxHash: data.fundingTxHash,
        fundingBlock: data.fundingBlock,
        fundingTimestamp: data.fundingTimestamp,
        fundingAmount: data.fundingAmount,
        fundingCurrency: data.fundingCurrency ?? 'ETH',
        timeToDeploymentMinutes: data.timeToDeploymentMinutes,
        fundingSourceType: data.fundingSourceType,
        clusterId: data.clusterId,
        firstSeen: data.firstSeen,
      },
      update: data,
    });
  }

  async getFundingProfile(wallet: string): Promise<FundingProfileData | null> {
    const profile = await this.prisma.fundingProfile.findUnique({
      where: { wallet: wallet.toLowerCase() },
    });
    if (!profile) return null;
    return this.mapProfile(profile);
  }

  async listFundingSources(limit: number = 20): Promise<{ source: string; count: number }[]> {
    const groups = await this.prisma.fundingProfile.groupBy({
      by: ['fundingSourceType'],
      _count: { wallet: true },
      orderBy: { _count: { wallet: 'desc' } },
      take: limit,
    });
    return groups.map((g) => ({ source: g.fundingSourceType, count: g._count.wallet }));
  }

  async overview(): Promise<{
    total: number;
    fundedCount: number;
    exchangeCount: number;
    bridgeCount: number;
    eoaCount: number;
    unknownCount: number;
    clusterCount: number;
    averageTimeToDeploy: number | null;
  }> {
    const [total, funded, exchange, bridge, eoa, unknown, clusters, timeData] = await Promise.all([
      this.prisma.fundingProfile.count(),
      this.prisma.fundingProfile.count({ where: { fundedBy: { not: null } } }),
      this.prisma.fundingProfile.count({ where: { fundingSourceType: 'exchange' } }),
      this.prisma.fundingProfile.count({ where: { fundingSourceType: 'bridge' } }),
      this.prisma.fundingProfile.count({ where: { fundingSourceType: 'eoa' } }),
      this.prisma.fundingProfile.count({ where: { fundingSourceType: 'Unknown' } }),
      this.prisma.fundingCluster.count(),
      this.prisma.fundingProfile.aggregate({
        _avg: { timeToDeploymentMinutes: true },
        where: { timeToDeploymentMinutes: { not: null } },
      }),
    ]);

    return {
      total,
      fundedCount: funded,
      exchangeCount: exchange,
      bridgeCount: bridge,
      eoaCount: eoa,
      unknownCount: unknown,
      clusterCount: clusters,
      averageTimeToDeploy: timeData._avg.timeToDeploymentMinutes ?? null,
    };
  }

  async listWallets(options: ListFundingOptions = {}): Promise<FundingListResult> {
    const { page = 1, limit = 20, source, cluster, minAmount, sort = 'recent' } = options;

    const where: Prisma.FundingProfileWhereInput = {};

    if (source) where.fundingSourceType = source;
    if (cluster) where.clusterId = cluster;
    if (minAmount !== undefined) {
      where.fundingAmount = { not: null };
    }

    const orderBy = this.buildOrderBy(sort);

    const [total, profiles] = await Promise.all([
      this.prisma.fundingProfile.count({ where }),
      this.prisma.fundingProfile.findMany({
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

  async upsertCluster(
    funderWallet: string,
    data: {
      walletCount: number;
      deployments: number;
      successfulTokens: number;
      highRiskTokens: number;
      chains: string[];
      totalFunding: string;
      firstSeen: Date | null;
      lastSeen: Date | null;
    },
  ): Promise<string> {
    const fw = funderWallet.toLowerCase();
    const existing = await this.prisma.fundingCluster.findFirst({
      where: { funderWallet: fw },
    });

    if (existing) {
      await this.prisma.fundingCluster.update({
        where: { id: existing.id },
        data,
      });
      return existing.id;
    }

    const cluster = await this.prisma.fundingCluster.create({
      data: { funderWallet: fw, ...data },
    });
    return cluster.id;
  }

  async getClusters(limit: number = 20): Promise<FundingClusterData[]> {
    const clusters = await this.prisma.fundingCluster.findMany({
      orderBy: { walletCount: 'desc' },
      take: limit,
    });
    return clusters.map((c) => ({
      id: c.id,
      funderWallet: c.funderWallet,
      walletCount: c.walletCount,
      deployments: c.deployments,
      successfulTokens: c.successfulTokens,
      highRiskTokens: c.highRiskTokens,
      chains: (c.chains as string[]) ?? [],
      totalFunding: c.totalFunding,
      firstSeen: c.firstSeen?.toISOString() ?? null,
      lastSeen: c.lastSeen?.toISOString() ?? null,
    }));
  }

  async getCluster(id: string): Promise<FundingClusterData | null> {
    const c = await this.prisma.fundingCluster.findUnique({ where: { id } });
    if (!c) return null;
    return {
      id: c.id,
      funderWallet: c.funderWallet,
      walletCount: c.walletCount,
      deployments: c.deployments,
      successfulTokens: c.successfulTokens,
      highRiskTokens: c.highRiskTokens,
      chains: (c.chains as string[]) ?? [],
      totalFunding: c.totalFunding,
      firstSeen: c.firstSeen?.toISOString() ?? null,
      lastSeen: c.lastSeen?.toISOString() ?? null,
    };
  }

  async getWalletsByFunder(funder: string): Promise<FundingProfileData[]> {
    const profiles = await this.prisma.fundingProfile.findMany({
      where: { fundedBy: funder.toLowerCase() },
    });
    return profiles.map((p) => this.mapProfile(p));
  }

  private buildOrderBy(sort: string): Prisma.FundingProfileOrderByWithRelationInput {
    switch (sort) {
      case 'recent':
        return { fundingTimestamp: 'desc' };
      case 'largest':
        return { fundingAmount: 'desc' };
      case 'deployment_speed':
        return { timeToDeploymentMinutes: 'asc' };
      default:
        return { fundingTimestamp: 'desc' };
    }
  }

  private mapProfile(profile: {
    wallet: string;
    fundedBy: string | null;
    fundingTxHash: string | null;
    fundingBlock: bigint | null;
    fundingTimestamp: Date | null;
    fundingAmount: string | null;
    fundingCurrency: string;
    timeToDeploymentMinutes: number | null;
    fundingSourceType: string;
    clusterId: string | null;
    firstSeen: Date | null;
  }): FundingProfileData {
    return {
      wallet: profile.wallet,
      fundedBy: profile.fundedBy,
      fundingTxHash: profile.fundingTxHash,
      fundingBlock: profile.fundingBlock?.toString() ?? null,
      fundingTimestamp: profile.fundingTimestamp?.toISOString() ?? null,
      fundingAmount: profile.fundingAmount,
      fundingCurrency: profile.fundingCurrency,
      timeToDeploymentMinutes: profile.timeToDeploymentMinutes,
      fundingSourceType: profile.fundingSourceType,
      fundingSourceLabel:
        profile.fundingSourceType === 'exchange'
          ? 'Exchange'
          : profile.fundingSourceType === 'bridge'
            ? 'Bridge'
            : profile.fundingSourceType === 'eoa'
              ? 'EOA'
              : profile.fundingSourceType,
      clusterId: profile.clusterId,
      firstSeen: profile.firstSeen?.toISOString() ?? null,
    };
  }
}
