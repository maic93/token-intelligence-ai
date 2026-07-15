import type { Logger } from '@token-intelligence-ai/shared';
import { Redis } from 'ioredis';

const TOKEN_DISCOVERY_CHANNEL = 'token:discovery';

export function createPublisher(redisUrl: string, log: Logger): Publisher {
  let client: Redis | null = null;

  function connect(): void {
    try {
      client = new Redis(redisUrl, {
        lazyConnect: false,
        maxRetriesPerRequest: 2,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      });

      client.on('error', (err: Error) => {
        log.warn('Redis publisher error', { error: String(err) });
      });

      client.on('connect', () => {
        log.info('Redis publisher connected');
      });
    } catch {
      log.warn('Redis publisher not available');
    }
  }

  function publish(channel: string, data: unknown): void {
    if (!client) return;
    try {
      client.publish(channel, JSON.stringify(data)).catch(() => {});
    } catch {
      log.warn('Redis publish failed');
    }
  }

  function disconnect(): void {
    if (client) {
      client.quit().catch(() => {});
      client = null;
    }
  }

  return { connect, publish, disconnect, tokenDiscoveryChannel: TOKEN_DISCOVERY_CHANNEL };
}

export interface Publisher {
  connect(): void;
  publish(channel: string, data: unknown): void;
  disconnect(): void;
  tokenDiscoveryChannel: string;
}
