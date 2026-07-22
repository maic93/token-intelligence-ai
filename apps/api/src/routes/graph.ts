import { Router } from 'express';
import { prisma } from '@token-intelligence-ai/database';
import { WalletGraphRepository } from '@token-intelligence-ai/database';
import {
  findShortestFundingPath,
  findConnectedWallets,
  findFundingClusters,
  findRecursiveFunding,
  findCommonFunders,
  buildWalletGraph,
  computeGraphMetrics,
  assignWalletLabels,
} from '@token-intelligence-ai/analysis';
import type { Request, Response } from 'express';

const repo = new WalletGraphRepository(prisma);
const router: Router = Router();

router.get('/path', async (req: Request, res: Response) => {
  try {
    const { from, to, depth } = req.query;
    if (!from || !to) {
      res.status(400).json({ error: 'from and to query params required' });
      return;
    }
    const path = await findShortestFundingPath(
      repo,
      from as string,
      to as string,
      depth ? Number(depth) : 5,
    );
    if (!path) {
      res.json({ path: null, confidence: 0 });
      return;
    }
    res.json(path);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/connected', async (req: Request, res: Response) => {
  try {
    const { wallet, depth } = req.query;
    if (!wallet) {
      res.status(400).json({ error: 'wallet query param required' });
      return;
    }
    const connected = await findConnectedWallets(repo, wallet as string, depth ? Number(depth) : 3);
    res.json({ wallet, connected });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/cluster/:wallet', async (req: Request, res: Response) => {
  try {
    const wallet = req.params.wallet as string;
    const clusters = await findFundingClusters(repo, [wallet]);
    const { edges, adjacency } = await buildWalletGraph(repo, [wallet]);
    const metrics = computeGraphMetrics(adjacency, wallet.toLowerCase());
    const labels = assignWalletLabels(metrics, edges);
    res.json({ clusters, metrics, labels });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/tree/:wallet', async (req: Request, res: Response) => {
  try {
    const wallet = req.params.wallet as string;
    const depthVal = req.query.depth as string | undefined;
    const tree = await findRecursiveFunding(repo, wallet, depthVal ? Number(depthVal) : 5);
    res.json({ wallet, tree });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/common-funders', async (req: Request, res: Response) => {
  try {
    const { walletA, walletB } = req.query;
    if (!walletA || !walletB) {
      res.status(400).json({ error: 'walletA and walletB query params required' });
      return;
    }
    const funders = await findCommonFunders(repo, walletA as string, walletB as string);
    res.json({ walletA, walletB, commonFunders: funders });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export { router as graphRouter };
