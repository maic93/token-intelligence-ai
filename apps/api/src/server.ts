import express, { type Express } from 'express';
import path from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Logger } from '@token-intelligence-ai/shared';
import { healthRouter } from './routes/health.js';
import { tokensRouter } from './routes/tokens.js';
import { statsRouter } from './routes/stats.js';
import { chainsRouter } from './routes/chains.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { config } from './config.js';

export function createApp(log: Logger): Express {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(requestLogger(log));

  app.use('/health', healthRouter);
  app.use('/api/tokens', tokensRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/chains', chainsRouter);

  if (config.NODE_ENV === 'production') {
    const dashboardPath = path.resolve(import.meta.dirname, '../../dashboard/dist');
    app.use(express.static(dashboardPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(dashboardPath, 'index.html'));
    });
  }

  app.use(errorHandler(log));

  return app;
}
