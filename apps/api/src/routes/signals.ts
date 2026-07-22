import { Router, type Router as RouterType } from 'express';
import { prisma } from '@token-intelligence-ai/database';

const router: RouterType = Router();

router.get('/smart-money', async (_req, res, next) => {
  try {
    const [eliteWallets, scoreIncreases, multiChain, serialSuccess, serialFailure, highWinRate] =
      await Promise.all([
        prisma.smartMoneyProfile.findMany({
          where: { grade: 'Elite' },
          orderBy: { score: 'desc' },
          take: 10,
          select: { wallet: true, score: true, grade: true, summary: true },
        }),
        prisma.smartMoneyProfile.findMany({
          where: { score: { gte: 70 } },
          orderBy: { tokensCreated: 'desc' },
          take: 10,
          select: { wallet: true, score: true, grade: true, summary: true },
        }),
        prisma.smartMoneyProfile.findMany({
          where: { labels: { array_contains: 'Multi-chain' } },
          orderBy: { score: 'desc' },
          take: 10,
          select: { wallet: true, score: true, grade: true, summary: true },
        }),
        prisma.smartMoneyProfile.findMany({
          where: { winRate: { gte: 80 }, tokensCreated: { gte: 5 } },
          orderBy: { winRate: 'desc' },
          take: 10,
          select: { wallet: true, score: true, grade: true, winRate: true, summary: true },
        }),
        prisma.smartMoneyProfile.findMany({
          where: {
            grade: { in: ['Dangerous', 'Speculative'] },
            tokensCreated: { gte: 3 },
          },
          orderBy: { tokensCreated: 'desc' },
          take: 10,
          select: { wallet: true, score: true, grade: true, tokensCreated: true, summary: true },
        }),
        prisma.smartMoneyProfile.findMany({
          where: { winRate: { gte: 90 }, tokensCreated: { gte: 3 } },
          orderBy: { winRate: 'desc' },
          take: 10,
          select: { wallet: true, score: true, grade: true, winRate: true, summary: true },
        }),
      ]);

    const mapEntry = (
      entry: {
        wallet: string;
        score: number;
        grade: string;
        summary: string;
        tokensCreated?: number;
        winRate?: number;
      },
      type: string,
    ) => ({
      wallet: entry.wallet,
      type,
      score: entry.score,
      grade: entry.grade,
      summary: entry.summary,
      tokensCreated: (entry as typeof entry & { tokensCreated?: number }).tokensCreated,
      winRate: (entry as typeof entry & { winRate?: number }).winRate,
    });

    const signals = [
      ...eliteWallets.map((w) => mapEntry(w, 'NEW_ELITE_WALLET')),
      ...scoreIncreases.map((w) => mapEntry(w, 'SCORE_INCREASE')),
      ...multiChain.map((w) => mapEntry(w, 'NEW_MULTI_CHAIN')),
      ...serialSuccess.map((w) => mapEntry(w, 'SERIAL_SUCCESS')),
      ...serialFailure.map((w) => mapEntry(w, 'SERIAL_FAILURE')),
      ...highWinRate.map((w) => mapEntry(w, 'HIGH_WIN_RATE')),
    ];

    res.json({ data: signals });
  } catch (error) {
    next(error);
  }
});

router.get('/funding', async (_req, res, next) => {
  try {
    const [cexFunded, bridgeFunded, clusters, fastDeployment, largeFunding, reusedFunder] =
      await Promise.all([
        prisma.fundingProfile.findMany({
          where: { fundingSourceType: 'exchange' },
          orderBy: { fundingTimestamp: 'desc' },
          take: 10,
          select: {
            wallet: true,
            fundedBy: true,
            fundingSourceType: true,
            timeToDeploymentMinutes: true,
          },
        }),
        prisma.fundingProfile.findMany({
          where: { fundingSourceType: 'bridge' },
          orderBy: { fundingTimestamp: 'desc' },
          take: 10,
          select: {
            wallet: true,
            fundedBy: true,
            fundingSourceType: true,
            timeToDeploymentMinutes: true,
          },
        }),
        prisma.fundingCluster.findMany({
          orderBy: { walletCount: 'desc' },
          take: 10,
          select: { id: true, funderWallet: true, walletCount: true, deployments: true },
        }),
        prisma.fundingProfile.findMany({
          where: {
            timeToDeploymentMinutes: { not: null, lte: 60 },
            fundedBy: { not: null },
          },
          orderBy: { timeToDeploymentMinutes: 'asc' },
          take: 10,
          select: {
            wallet: true,
            fundedBy: true,
            timeToDeploymentMinutes: true,
            fundingSourceType: true,
          },
        }),
        prisma.fundingProfile.findMany({
          where: { fundedBy: { not: null } },
          orderBy: { fundingAmount: 'desc' },
          take: 10,
          select: { wallet: true, fundedBy: true, fundingAmount: true, fundingSourceType: true },
        }),
        prisma.fundingProfile.groupBy({
          by: ['fundedBy'],
          _count: { wallet: true },
          orderBy: { _count: { wallet: 'desc' } },
          having: { wallet: { _count: { gte: 2 } } },
          take: 10,
        }),
      ]);

    const signals = [
      ...cexFunded.map((w) => ({
        wallet: w.wallet,
        type: 'NEW_CEX_FUNDED',
        fundedBy: w.fundedBy,
        fundingSourceType: w.fundingSourceType,
        timeToDeploymentMinutes: w.timeToDeploymentMinutes,
      })),
      ...bridgeFunded.map((w) => ({
        wallet: w.wallet,
        type: 'NEW_BRIDGE_FUNDED',
        fundedBy: w.fundedBy,
        fundingSourceType: w.fundingSourceType,
        timeToDeploymentMinutes: w.timeToDeploymentMinutes,
      })),
      ...clusters.map((c) => ({
        wallet: c.funderWallet,
        type: 'NEW_CLUSTER',
        clusterId: c.id,
        walletCount: c.walletCount,
        deployments: c.deployments,
      })),
      ...fastDeployment.map((w) => ({
        wallet: w.wallet,
        type: 'FAST_DEPLOYMENT',
        fundedBy: w.fundedBy,
        timeToDeploymentMinutes: w.timeToDeploymentMinutes,
        fundingSourceType: w.fundingSourceType,
      })),
      ...largeFunding.map((w) => ({
        wallet: w.wallet,
        type: 'LARGE_FUNDING',
        fundedBy: w.fundedBy,
        fundingAmount: w.fundingAmount,
        fundingSourceType: w.fundingSourceType,
      })),
      ...reusedFunder.map((w) => ({
        funder: w.fundedBy,
        type: 'REUSED_FUNDER',
        walletCount: w._count.wallet,
      })),
    ];

    res.json({ data: signals });
  } catch (error) {
    next(error);
  }
});

export { router as signalsRouter };
