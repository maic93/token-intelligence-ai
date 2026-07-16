import { createClient, type RedisClientType } from 'redis';
import { prisma } from '@token-intelligence-ai/database';
import type { WatchEventType } from '@token-intelligence-ai/shared';
import { createLogger } from '@token-intelligence-ai/shared';

const log = createLogger('indexer:watch');

let redisClient: RedisClientType | null = null;

export async function initWatchPublisher(redisUrl: string): Promise<void> {
  if (!redisUrl) {
    log.info('Redis URL not configured, watch events will be stored locally only');
    return;
  }
  try {
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
    log.info('Watch publisher connected to Redis');
  } catch (error) {
    log.error('Failed to connect watch publisher to Redis', { error: String(error) });
    redisClient = null;
  }
}

export async function publishWatchEvent(
  tokenId: string,
  eventType: WatchEventType,
  message: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const event = await prisma.watchEvent.create({
      data: { tokenId, eventType, message, metadata: metadata as never },
    });

    if (redisClient?.isOpen) {
      await redisClient.publish(
        'watch:events',
        JSON.stringify({
          id: event.id,
          tokenId: event.tokenId,
          eventType: event.eventType,
          message: event.message,
          metadata: event.metadata,
          createdAt: event.createdAt.toISOString(),
        }),
      );
    }
  } catch (error) {
    log.error('Failed to publish watch event', { error: String(error) });
  }
}

export async function shutdownWatchPublisher(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }
    redisClient = null;
  }
}
