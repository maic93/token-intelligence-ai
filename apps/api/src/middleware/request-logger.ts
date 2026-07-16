import type { Request, Response, NextFunction } from 'express';
import type { Logger } from '@token-intelligence-ai/shared';
import { trackRequest } from '../routes/metrics.js';

export function requestLogger(log: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    const requestId = (req as { requestId?: string }).requestId;

    res.once('finish', () => {
      const durationMs = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      log[level]('Request', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs,
        requestId,
      });

      const route = req.route?.path ?? req.originalUrl.split('?')[0];
      trackRequest(req.method, route, res.statusCode, durationMs);
    });

    next();
  };
}
