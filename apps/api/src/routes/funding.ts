import { Router, type Router as RouterType } from 'express';
import { prisma, FundingRepository } from '@token-intelligence-ai/database';

const fundingRepo = new FundingRepository(prisma);
const router: RouterType = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const source = req.query.source as string | undefined;
    const cluster = req.query.cluster as string | undefined;
    const minAmount = req.query.minAmount ? parseInt(req.query.minAmount as string, 10) : undefined;
    const sort = (req.query.sort as string) || 'recent';

    const result = await fundingRepo.listWallets({ page, limit, source, cluster, minAmount, sort });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/overview', async (_req, res, next) => {
  try {
    const overview = await fundingRepo.overview();
    res.json({ data: overview });
  } catch (error) {
    next(error);
  }
});

router.get('/sources', async (_req, res, next) => {
  try {
    const sources = await fundingRepo.listFundingSources(50);
    res.json({ data: sources });
  } catch (error) {
    next(error);
  }
});

router.get('/clusters', async (_req, res, next) => {
  try {
    const clusters = await fundingRepo.getClusters(50);
    res.json({ data: clusters });
  } catch (error) {
    next(error);
  }
});

router.get('/clusters/:id', async (req, res, next) => {
  try {
    const cluster = await fundingRepo.getCluster(req.params.id);
    if (!cluster) {
      res.status(404).json({ error: 'Cluster not found' });
      return;
    }
    const wallets = await fundingRepo.getWalletsByFunder(cluster.funderWallet);
    res.json({ data: { cluster, wallets } });
  } catch (error) {
    next(error);
  }
});

router.get('/:wallet', async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const profile = await fundingRepo.getFundingProfile(wallet.toLowerCase());
    if (!profile) {
      res.status(404).json({ error: 'Funding profile not found' });
      return;
    }

    const tokens = await prisma.token.findMany({
      where: { deployer: wallet.toLowerCase() },
      orderBy: { discoveredAt: 'desc' },
      take: 50,
      select: {
        id: true,
        chain: true,
        contractAddress: true,
        name: true,
        symbol: true,
        discoveredAt: true,
        fundedBy: true,
        fundingAmount: true,
        fundingTimestamp: true,
        fundingSourceType: true,
        timeToDeploymentMinutes: true,
      },
    });

    const smartMoney = await prisma.smartMoneyProfile.findUnique({
      where: { wallet: wallet.toLowerCase() },
      select: { score: true, grade: true },
    });

    const walletIntelligence = await prisma.walletProfile.findUnique({
      where: { wallet: wallet.toLowerCase() },
      select: { reputation: true, grade: true, labels: true },
    });

    let cluster = null;
    if (profile.clusterId) {
      cluster = await fundingRepo.getCluster(profile.clusterId);
    }

    res.json({
      data: {
        profile,
        tokens,
        smartMoney,
        walletIntelligence,
        cluster,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as fundingRouter };
