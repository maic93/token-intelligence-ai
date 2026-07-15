import type { Request, Response, NextFunction } from 'express';
import type { Logger } from '@token-intelligence-ai/shared';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(log: Logger) {
  return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }

    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }

    log.error('Unhandled error', { error: String(err) });
    res.status(500).json({ error: 'Internal server error' });
  };
}
