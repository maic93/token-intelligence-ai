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

export { router as signalsRouter };
