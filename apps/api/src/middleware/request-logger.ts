import type { Request, Response, NextFunction } from 'express';
import type { Logger } from '@token-intelligence-ai/shared';

export function requestLogger(log: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.once('finish', () => {
      log.info('Request', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - start,
      });
    });

    next();
  };
}
