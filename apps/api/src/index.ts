import { createLogger } from '@token-intelligence-ai/shared';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { prisma } from '@token-intelligence-ai/database';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { tokensRouter } from './routes/tokens.js';
import { statsRouter } from './routes/stats.js';
import { chainsRouter } from './routes/chains.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';

const log = createLogger('api');
const app = express();

app.use(cors());
app.use(express.json());
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

async function shutdown(signal: string): Promise<void> {
  log.info('Shutdown requested', { signal });
  await prisma.$disconnect();
  log.info('API stopped');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

app.listen(config.PORT, () => {
  log.info('API listening', { port: config.PORT });
});
