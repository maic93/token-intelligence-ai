import { Router, type Router as RouterType } from 'express';
import {
  prisma,
  TokenRepository,
  SmartMoneyRepository,
  FundingRepository,
} from '@token-intelligence-ai/database';

const tokenRepo = new TokenRepository(prisma);
const smartMoneyRepo = new SmartMoneyRepository(prisma);
const fundingRepo = new FundingRepository(prisma);
const router: RouterType = Router();

interface LeaderboardEntry {
  rank: number;
  identifier: string;
  displayName?: string;
  value: number;
  chain?: string;
  extra?: Record<string, unknown>;
}

router.get('/deployers', async (_req, res, next) => {
  try {
    const deployers = await prisma.deployerAnalytics.findMany({
      orderBy: { tokensCreated: 'desc' },
      take: 50,
    });
    const items: LeaderboardEntry[] = deployers.map((d, i) => ({
      rank: i + 1,
      identifier: d.wallet,
      displayName: d.wallet.slice(0, 10) + '...',
      value: d.tokensCreated,
      extra: {
        reputationScore: d.reputationScore,
        reputationGrade: d.reputationGrade,
        avgRiskScore: d.avgRiskScore,
      },
    }));
    res.json({ data: items });
  } catch (error) {
    next(error);
  }
});

router.get('/smart-money', async (_req, res, next) => {
  try {
    const wallets = await smartMoneyRepo.listTopWallets(50);
    const items: LeaderboardEntry[] = wallets.map((w, i) => ({
      rank: i + 1,
      identifier: w.wallet,
      value: w.score,
      extra: {
        grade: w.grade,
        winRate: w.winRate,
        tokensCreated: w.tokensCreated,
        successfulTokens: w.successfulTokens,
      },
    }));
    res.json({ data: items });
  } catch (error) {
    next(error);
  }
});

router.get('/opportunity', async (_req, res, next) => {
  try {
    const signals = await prisma.signal.findMany({
      orderBy: { opportunityScore: 'desc' },
      take: 50,
      include: {
        token: { select: { chain: true, contractAddress: true, name: true, symbol: true } },
      },
    });
    const items: LeaderboardEntry[] = signals.map((s, i) => ({
      rank: i + 1,
      identifier: s.tokenId,
      displayName: s.token?.name ?? 'Unknown',
      value: s.opportunityScore,
      extra: {
        rating: s.rating,
        confidence: s.confidence,
        chain: s.token?.chain,
        symbol: s.token?.symbol,
        contract: s.token?.contractAddress,
      },
    }));
    res.json({ data: items });
  } catch (error) {
    next(error);
  }
});

router.get('/lowest-risk', async (_req, res, next) => {
  try {
    const signals = await prisma.signal.findMany({
      orderBy: { riskScore: 'asc' },
      take: 50,
      include: {
        token: { select: { chain: true, contractAddress: true, name: true, symbol: true } },
      },
    });
    const items: LeaderboardEntry[] = signals.map((s, i) => ({
      rank: i + 1,
      identifier: s.tokenId,
      displayName: s.token?.name ?? 'Unknown',
      value: s.riskScore,
      extra: {
        rating: s.rating,
        confidence: s.confidence,
        chain: s.token?.chain,
        symbol: s.token?.symbol,
      },
    }));
    res.json({ data: items });
  } catch (error) {
    next(error);
  }
});

router.get('/funding', async (_req, res, next) => {
  try {
    const clusters = await fundingRepo.getClusters(50);
    const items: LeaderboardEntry[] = clusters.map((c, i) => ({
      rank: i + 1,
      identifier: c.funderWallet,
      value: c.deployments,
      extra: {
        walletCount: c.walletCount,
        successfulTokens: c.successfulTokens,
        totalFunding: c.totalFunding,
        chains: c.chains,
      },
    }));
    res.json({ data: items });
  } catch (error) {
    next(error);
  }
});

router.get('/chains', async (_req, res, next) => {
  try {
    const counts = await tokenRepo.getChainCounts();
    const sorted = [...counts].sort((a, b) => b.count - a.count);
    const items: LeaderboardEntry[] = sorted.map((c, i) => ({
      rank: i + 1,
      identifier: c.chain,
      displayName: c.chain.charAt(0).toUpperCase() + c.chain.slice(1),
      value: c.count,
    }));
    res.json({ data: items });
  } catch (error) {
    next(error);
  }
});

export { router as leaderboardsRouter };
