import { createLogger } from '@token-intelligence-ai/shared';
import type { Server as HttpServer } from 'node:http';
import { config } from './config.js';
import { createApp } from './server.js';
import { prisma } from '@token-intelligence-ai/database';
import { connectRedis, disconnectRedis, getSubscriber, TOKEN_DISCOVERY_CHANNEL } from './redis.js';
import { createWebSocketServer, broadcast, closeWebSocketServer } from './ws.js';

const log = createLogger('api');

async function shutdown(server: HttpServer, signal: string): Promise<void> {
  log.info('Shutdown requested', { signal });

  server.close(async () => {
    closeWebSocketServer();
    await disconnectRedis();
    await prisma.$disconnect();
    log.info('API stopped');
    process.exit(0);
  });

  setTimeout(() => {
    log.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

async function main(): Promise<void> {
  await connectRedis();
  const sub = getSubscriber();

  const app = createApp(log);

  const server = app.listen(config.PORT, () => {
    log.info('API listening', { port: config.PORT });
  });

  createWebSocketServer(server);

  try {
    await sub.connect();
    await sub.subscribe(TOKEN_DISCOVERY_CHANNEL, (err) => {
      if (err) {
        log.error('Redis subscribe failed', { error: String(err) });
        return;
      }
      log.info('Subscribed to token discovery channel');
    });

    sub.on('message', (channel: string, message: string) => {
      if (channel === TOKEN_DISCOVERY_CHANNEL) {
        try {
          const data = JSON.parse(message);
          broadcast('token:discovery', data);
        } catch {
          log.warn('Invalid token discovery message');
        }
      }
    });
  } catch (err) {
    log.warn('Redis subscriber not available, real-time updates disabled', { error: String(err) });
  }

  process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));
  process.on('SIGINT', () => shutdown(server, 'SIGINT'));
}

main().catch((error) => {
  log.error('Fatal error', { error: String(error) });
  process.exit(1);
});
