import { PrismaClient, Prisma } from '@prisma/client';

export interface CreateEdgeInput {
  fromWallet: string;
  toWallet: string;
  chain: string;
  tokenAddress?: string | null;
  currency?: string;
  amount: string;
  amountUsd?: number | null;
  blockNumber: bigint;
  timestamp: Date;
  transactionHash: string;
  edgeType: WalletEdgeType;
  confidence?: number;
}

export interface EdgeData {
  id: string;
  fromWallet: string;
  toWallet: string;
  chain: string;
  tokenAddress: string | null;
  currency: string;
  amount: string;
  amountUsd: number | null;
  blockNumber: string;
  timestamp: string;
  transactionHash: string;
  edgeType: string;
  confidence: number;
  createdAt: string;
}

export interface ClusterData {
  id: string;
  clusterId: string;
  wallet: string;
  role: string;
  score: number;
  depth: number;
  createdAt: string;
}

export interface PathResult {
  wallets: string[];
  edges: EdgeData[];
  totalConfidence: number;
  depth: number;
}

export interface ClusterMember {
  wallet: string;
  role: string;
  score: number;
  depth: number;
}

export type WalletEdgeType =
  'Funding' | 'Transfer' | 'Bridge' | 'CEX' | 'Internal' | 'Contract' | 'Liquidity' | 'Unknown';

export const WALLET_EDGE_TYPES: WalletEdgeType[] = [
  'Funding',
  'Transfer',
  'Bridge',
  'CEX',
  'Internal',
  'Contract',
  'Liquidity',
  'Unknown',
];

export class WalletGraphRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveEdge(input: CreateEdgeInput): Promise<EdgeData> {
    const edge = await this.prisma.walletEdge.create({
      data: {
        fromWallet: input.fromWallet.toLowerCase(),
        toWallet: input.toWallet.toLowerCase(),
        chain: input.chain,
        tokenAddress: input.tokenAddress?.toLowerCase() ?? null,
        currency: input.currency ?? 'ETH',
        amount: input.amount,
        amountUsd: input.amountUsd ?? null,
        blockNumber: input.blockNumber,
        timestamp: input.timestamp,
        transactionHash: input.transactionHash.toLowerCase(),
        edgeType: input.edgeType,
        confidence: input.confidence ?? 50,
      },
    });
    return this.mapEdge(edge);
  }

  async saveCluster(
    clusterId: string,
    wallet: string,
    role: string,
    score: number,
    depth: number,
  ): Promise<ClusterData> {
    const existing = await this.prisma.walletCluster.findFirst({
      where: { clusterId, wallet: wallet.toLowerCase() },
    });
    if (existing) {
      const updated = await this.prisma.walletCluster.update({
        where: { id: existing.id },
        data: { role, score, depth },
      });
      return this.mapCluster(updated);
    }
    const created = await this.prisma.walletCluster.create({
      data: {
        clusterId,
        wallet: wallet.toLowerCase(),
        role,
        score,
        depth,
      },
    });
    return this.mapCluster(created);
  }

  async findEdges(
    fromWallet?: string,
    toWallet?: string,
    chain?: string,
    edgeType?: string,
    limit = 100,
  ): Promise<EdgeData[]> {
    const where: Prisma.WalletEdgeWhereInput = {};
    if (fromWallet) where.fromWallet = fromWallet.toLowerCase();
    if (toWallet) where.toWallet = toWallet.toLowerCase();
    if (chain) where.chain = chain;
    if (edgeType) where.edgeType = edgeType;
    const edges = await this.prisma.walletEdge.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    return edges.map((e) => this.mapEdge(e));
  }

  async findEdgesBatch(
    fromWallets: string[],
    toWallets: string[],
    limit = 500,
  ): Promise<EdgeData[]> {
    const edges = await this.prisma.walletEdge.findMany({
      where: {
        OR: [
          { fromWallet: { in: fromWallets.map((w) => w.toLowerCase()) } },
          { toWallet: { in: toWallets.map((w) => w.toLowerCase()) } },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    return edges.map((e) => this.mapEdge(e));
  }

  async findCluster(clusterId: string): Promise<ClusterData[]> {
    const members = await this.prisma.walletCluster.findMany({
      where: { clusterId },
      orderBy: { score: 'desc' },
    });
    return members.map((m) => this.mapCluster(m));
  }

  async findClustersByWallet(
    wallet: string,
  ): Promise<{ clusterId: string; role: string; score: number }[]> {
    const members = await this.prisma.walletCluster.findMany({
      where: { wallet: wallet.toLowerCase() },
    });
    return members.map((m) => ({ clusterId: m.clusterId, role: m.role, score: m.score }));
  }

  async findPath(fromWallet: string, toWallet: string, maxDepth = 5): Promise<PathResult | null> {
    const visited = new Set<string>();
    const queue: {
      wallet: string;
      path: string[];
      edgeIds: string[];
      confidenceSum: number;
      depth: number;
    }[] = [
      {
        wallet: fromWallet.toLowerCase(),
        path: [fromWallet.toLowerCase()],
        edgeIds: [],
        confidenceSum: 0,
        depth: 0,
      },
    ];
    visited.add(fromWallet.toLowerCase());

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.wallet === toWallet.toLowerCase()) {
        const edges = await this.prisma.walletEdge.findMany({
          where: { id: { in: current.edgeIds } },
        });
        return {
          wallets: current.path,
          edges: edges.map((e) => this.mapEdge(e)),
          totalConfidence:
            current.depth > 0 ? Math.round(current.confidenceSum / current.depth) : 0,
          depth: current.depth,
        };
      }
      if (current.depth >= maxDepth) continue;

      const outEdges = await this.prisma.walletEdge.findMany({
        where: { fromWallet: current.wallet },
        take: 50,
      });
      for (const edge of outEdges) {
        if (!visited.has(edge.toWallet)) {
          visited.add(edge.toWallet);
          queue.push({
            wallet: edge.toWallet,
            path: [...current.path, edge.toWallet],
            edgeIds: [...current.edgeIds, edge.id],
            confidenceSum: current.confidenceSum + edge.confidence,
            depth: current.depth + 1,
          });
        }
      }
    }
    return null;
  }

  async findConnectedWallets(
    wallet: string,
    maxDepth = 3,
  ): Promise<{ wallet: string; score: number; distance: number }[]> {
    const visited = new Map<string, { score: number; distance: number }>();
    const queue: { wallet: string; depth: number }[] = [{ wallet: wallet.toLowerCase(), depth: 0 }];
    visited.set(wallet.toLowerCase(), { score: 100, distance: 0 });

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      const outEdges = await this.prisma.walletEdge.findMany({
        where: { fromWallet: current.wallet },
        take: 100,
      });
      for (const edge of outEdges) {
        if (!visited.has(edge.toWallet)) {
          visited.set(edge.toWallet, { score: edge.confidence, distance: current.depth + 1 });
          queue.push({ wallet: edge.toWallet, depth: current.depth + 1 });
        }
      }
      const inEdges = await this.prisma.walletEdge.findMany({
        where: { toWallet: current.wallet },
        take: 100,
      });
      for (const edge of inEdges) {
        if (!visited.has(edge.fromWallet)) {
          visited.set(edge.fromWallet, { score: edge.confidence, distance: current.depth + 1 });
          queue.push({ wallet: edge.fromWallet, depth: current.depth + 1 });
        }
      }
    }

    visited.delete(wallet.toLowerCase());
    return Array.from(visited.entries()).map(([w, data]) => ({
      wallet: w,
      score: data.score,
      distance: data.distance,
    }));
  }

  async findFundingTree(
    wallet: string,
    maxDepth = 5,
  ): Promise<
    {
      wallet: string;
      funders: { from: string; amount: string; timestamp: string; confidence: number }[];
      depth: number;
    }[]
  > {
    const result: {
      wallet: string;
      funders: { from: string; amount: string; timestamp: string; confidence: number }[];
      depth: number;
    }[] = [];
    const visited = new Set<string>();
    const queue: { wallet: string; depth: number }[] = [{ wallet: wallet.toLowerCase(), depth: 0 }];
    visited.add(wallet.toLowerCase());

    while (queue.length > 0) {
      const current = queue.shift()!;
      const inEdges = await this.prisma.walletEdge.findMany({
        where: { toWallet: current.wallet, edgeType: { in: ['Funding', 'Bridge', 'CEX'] } },
        orderBy: { timestamp: 'desc' },
        take: 20,
      });
      const funders = inEdges.map((e) => ({
        from: e.fromWallet,
        amount: e.amount,
        timestamp: e.timestamp.toISOString(),
        confidence: e.confidence,
      }));
      result.push({ wallet: current.wallet, funders, depth: current.depth });

      if (current.depth < maxDepth) {
        for (const edge of inEdges) {
          if (!visited.has(edge.fromWallet)) {
            visited.add(edge.fromWallet);
            queue.push({ wallet: edge.fromWallet, depth: current.depth + 1 });
          }
        }
      }
    }
    return result;
  }

  async findCommonFunders(
    walletA: string,
    walletB: string,
  ): Promise<{ funder: string; amountA: string; amountB: string; totalConfidence: number }[]> {
    const a = walletA.toLowerCase();
    const b = walletB.toLowerCase();

    const edgesA = await this.prisma.walletEdge.findMany({
      where: { toWallet: a, edgeType: { in: ['Funding', 'Bridge', 'CEX'] } },
    });
    const edgesB = await this.prisma.walletEdge.findMany({
      where: { toWallet: b, edgeType: { in: ['Funding', 'Bridge', 'CEX'] } },
    });

    const fundersA = new Map(edgesA.map((e) => [e.fromWallet, e]));
    const fundersB = new Map(edgesB.map((e) => [e.fromWallet, e]));

    const common: string[] = [];
    for (const funder of fundersA.keys()) {
      if (fundersB.has(funder)) common.push(funder);
    }

    return common.map((funder) => ({
      funder,
      amountA: fundersA.get(funder)!.amount,
      amountB: fundersB.get(funder)!.amount,
      totalConfidence: Math.round(
        (fundersA.get(funder)!.confidence + fundersB.get(funder)!.confidence) / 2,
      ),
    }));
  }

  async findCircularFunding(
    maxDepth = 5,
  ): Promise<{ wallet: string; cycle: string[]; confidence: number }[]> {
    const cycles: { wallet: string; cycle: string[]; confidence: number }[] = [];
    const wallets = await this.prisma.walletEdge.findMany({
      select: { fromWallet: true },
      distinct: ['fromWallet'],
      take: 200,
    });

    for (const { fromWallet } of wallets) {
      const visited = new Set<string>();
      const stack: { wallet: string; path: string[]; confidenceSum: number }[] = [
        { wallet: fromWallet, path: [fromWallet], confidenceSum: 0 },
      ];
      visited.add(fromWallet);

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (current.path.length > maxDepth) continue;

        const outEdges = await this.prisma.walletEdge.findMany({
          where: { fromWallet: current.wallet },
          take: 50,
        });
        for (const edge of outEdges) {
          if (edge.toWallet === fromWallet && current.path.length >= 2) {
            cycles.push({
              wallet: fromWallet,
              cycle: [...current.path, edge.toWallet],
              confidence: Math.round(
                (current.confidenceSum + edge.confidence) / current.path.length,
              ),
            });
          } else if (!visited.has(edge.toWallet) && current.path.length < maxDepth) {
            const newVisited = new Set(visited);
            newVisited.add(edge.toWallet);
            stack.push({
              wallet: edge.toWallet,
              path: [...current.path, edge.toWallet],
              confidenceSum: current.confidenceSum + edge.confidence,
            });
          }
        }
      }
    }
    return cycles.slice(0, 20);
  }

  async findCommonDeployers(
    walletA: string,
    walletB: string,
  ): Promise<{ deployer: string; count: number }[]> {
    const a = walletA.toLowerCase();
    const b = walletB.toLowerCase();
    const tokensA = await this.prisma.token.findMany({
      where: { deployer: a },
      select: { contractAddress: true },
    });
    const contractsA = new Set(tokensA.map((t) => t.contractAddress));
    const common: { deployer: string; count: number }[] = [];
    if (contractsA.size === 0) return common;

    const deployersForB = await this.prisma.token.groupBy({
      by: ['deployer'],
      where: { contractAddress: { in: Array.from(contractsA) } },
      _count: { contractAddress: true },
    });
    for (const d of deployersForB) {
      if (d.deployer !== a && d.deployer !== b) {
        common.push({ deployer: d.deployer, count: d._count.contractAddress });
      }
    }
    return common.sort((x, y) => y.count - x.count).slice(0, 20);
  }

  async getDegreeCentrality(
    wallet: string,
  ): Promise<{ inDegree: number; outDegree: number; totalDegree: number }> {
    const [inCount, outCount] = await Promise.all([
      this.prisma.walletEdge.count({ where: { toWallet: wallet.toLowerCase() } }),
      this.prisma.walletEdge.count({ where: { fromWallet: wallet.toLowerCase() } }),
    ]);
    return { inDegree: inCount, outDegree: outCount, totalDegree: inCount + outCount };
  }

  async getGraphStats(): Promise<{
    totalEdges: number;
    totalClusters: number;
    uniqueWallets: number;
    avgConfidence: number;
  }> {
    const [totalEdges, totalClusters, distinctFrom, distinctTo, agg] = await Promise.all([
      this.prisma.walletEdge.count(),
      this.prisma.walletCluster.groupBy({ by: ['clusterId'], _count: { clusterId: true } }),
      this.prisma.walletEdge.findMany({ select: { fromWallet: true }, distinct: ['fromWallet'] }),
      this.prisma.walletEdge.findMany({ select: { toWallet: true }, distinct: ['toWallet'] }),
      this.prisma.walletEdge.aggregate({ _avg: { confidence: true } }),
    ]);
    const unique = new Set([
      ...distinctFrom.map((e) => e.fromWallet),
      ...distinctTo.map((e) => e.toWallet),
    ]);
    return {
      totalEdges,
      totalClusters: totalClusters.length,
      uniqueWallets: unique.size,
      avgConfidence: Math.round(agg._avg.confidence ?? 0),
    };
  }

  private mapEdge(e: {
    id: string;
    fromWallet: string;
    toWallet: string;
    chain: string;
    tokenAddress: string | null;
    currency: string;
    amount: string;
    amountUsd: number | null;
    blockNumber: bigint;
    timestamp: Date;
    transactionHash: string;
    edgeType: string;
    confidence: number;
    createdAt: Date;
  }): EdgeData {
    return {
      id: e.id,
      fromWallet: e.fromWallet,
      toWallet: e.toWallet,
      chain: e.chain,
      tokenAddress: e.tokenAddress,
      currency: e.currency,
      amount: e.amount,
      amountUsd: e.amountUsd,
      blockNumber: e.blockNumber.toString(),
      timestamp: e.timestamp.toISOString(),
      transactionHash: e.transactionHash,
      edgeType: e.edgeType,
      confidence: e.confidence,
      createdAt: e.createdAt.toISOString(),
    };
  }

  private mapCluster(c: {
    id: string;
    clusterId: string;
    wallet: string;
    role: string;
    score: number;
    depth: number;
    createdAt: Date;
  }): ClusterData {
    return {
      id: c.id,
      clusterId: c.clusterId,
      wallet: c.wallet,
      role: c.role,
      score: c.score,
      depth: c.depth,
      createdAt: c.createdAt.toISOString(),
    };
  }
}
