import { Router, type Router as RouterType } from 'express';
import { prisma, SignalRepository } from '@token-intelligence-ai/database';

const signalRepo = new SignalRepository(prisma);
const router: RouterType = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const result = await signalRepo.listSignals({
      signal: req.query.signal as string | undefined,
      rating: req.query.rating as string | undefined,
      minConfidence: req.query.minConfidence
        ? parseInt(req.query.minConfidence as string, 10)
        : undefined,
      maxRisk: req.query.maxRisk ? parseInt(req.query.maxRisk as string, 10) : undefined,
      minOpportunity: req.query.minOpportunity
        ? parseInt(req.query.minOpportunity as string, 10)
        : undefined,
      chain: req.query.chain as string | undefined,
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      limit,
      offset,
    });

    res.json({
      data: result.items,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/high-conviction', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const result = await signalRepo.getHighConviction(limit, offset);

    res.json({
      data: result.items,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/high-risk', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const result = await signalRepo.getHighRisk(limit, offset);

    res.json({
      data: result.items,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/watchlist', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const result = await signalRepo.getWatchlist(limit, offset);

    res.json({
      data: result.items,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/statistics', async (_req, res, next) => {
  try {
    const stats = await signalRepo.getStatistics();
    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
});

router.get('/:tokenId', async (req, res, next) => {
  try {
    const signal = await signalRepo.getSignal(req.params.tokenId);
    if (!signal) {
      res.status(404).json({ error: 'Signal not found' });
      return;
    }
    res.json({ data: signal });
  } catch (error) {
    next(error);
  }
});

export { router as signalsV2Router };
