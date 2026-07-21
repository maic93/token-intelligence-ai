import { Router, type Router as RouterType } from 'express';
import { prisma, SmartMoneyRepository } from '@token-intelligence-ai/database';

const smartMoneyRepo = new SmartMoneyRepository(prisma);
const router: RouterType = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const grade = req.query.grade as string | undefined;
    const label = req.query.label as string | undefined;
    const minScore = req.query.minScore ? parseInt(req.query.minScore as string, 10) : undefined;
    const sort = (req.query.sort as string) || 'score_desc';

    const result = await smartMoneyRepo.listWallets({ page, limit, grade, label, minScore, sort });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/overview', async (_req, res, next) => {
  try {
    const overview = await smartMoneyRepo.overview();
    res.json({ data: overview });
  } catch (error) {
    next(error);
  }
});

router.get('/top', async (_req, res, next) => {
  try {
    const wallets = await smartMoneyRepo.listTopWallets(20);
    res.json({ data: wallets });
  } catch (error) {
    next(error);
  }
});

router.get('/newest', async (_req, res, next) => {
  try {
    const wallets = await smartMoneyRepo.listNewest(20);
    res.json({ data: wallets });
  } catch (error) {
    next(error);
  }
});

router.get('/grade/:grade', async (req, res, next) => {
  try {
    const { grade } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const wallets = await smartMoneyRepo.listByGrade(grade, limit);
    res.json({ data: wallets });
  } catch (error) {
    next(error);
  }
});

router.get('/:wallet', async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const profile = await smartMoneyRepo.getProfile(wallet.toLowerCase());
    if (!profile) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const tokens = await prisma.token.findMany({
      where: { deployer: wallet.toLowerCase() },
      orderBy: { discoveredAt: 'desc' },
      take: 50,
      include: {
        analysis: { select: { riskScore: true, riskLevel: true } },
      },
    });

    const categories: Record<string, number> = {};
    const riskDistribution: Record<string, number> = {};
    for (const t of tokens) {
      categories[t.aiCategory] = (categories[t.aiCategory] || 0) + 1;
      if (t.analysis) {
        const level = t.analysis.riskLevel || 'UNKNOWN';
        riskDistribution[level] = (riskDistribution[level] || 0) + 1;
      }
    }

    res.json({
      data: {
        profile,
        recentDeployments: tokens.map((t) => ({
          contractAddress: t.contractAddress,
          chain: t.chain,
          name: t.name,
          symbol: t.symbol,
          riskScore: t.analysis?.riskScore ?? null,
          riskLevel: t.analysis?.riskLevel ?? null,
          aiCategory: t.aiCategory,
          aiConfidence: t.aiConfidence,
          discoveredAt: t.discoveredAt.toISOString(),
        })),
        categories,
        riskDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as smartMoneyRouter };
