import { Router, type Router as RouterType } from 'express';

const router: RouterType = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRouter };
