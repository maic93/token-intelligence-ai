import type { Request, Response, NextFunction } from 'express';
import type { Logger } from '@token-intelligence-ai/shared';
import { ZodError } from 'zod';

export function errorHandler(log: Logger) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    const requestId = (_req as { requestId?: string }).requestId;

    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors, requestId });
      return;
    }

    log.error('Unhandled error', { error: err, requestId });
    res.status(500).json({ error: 'Internal server error', requestId });
  };
}
