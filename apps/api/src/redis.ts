import { Redis } from 'ioredis';
import { createLogger } from '@token-intelligence-ai/shared';
import { config } from './config.js';

const log = createLogger('api:redis');
const DEFAULT_TTL = 30;
const TOKEN_TTL = 300;

let client: Redis | null = null;
let subscriber: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(config.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 5) return null;
        return Math.min(times * 200, 3000);
      },
    });

    client.on('error', (err: Error) => {
      log.error('Redis client error', { error: String(err) });
    });
  }
  return client;
}

export function getSubscriber(): Redis {
  if (!subscriber) {
    subscriber = new Redis(config.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 5) return null;
        return Math.min(times * 200, 3000);
      },
    });

    subscriber.on('error', (err: Error) => {
      log.error('Redis subscriber error', { error: String(err) });
    });
  }
  return subscriber;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis();
    const raw = await r.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
  try {
    const r = getRedis();
    await r.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    log.error('Cache set failed', { key, error: String(err) });
  }
}

export async function cacheSetToken(key: string, value: unknown): Promise<void> {
  await cacheSet(key, value, TOKEN_TTL);
}

export function buildTokenListKey(chain?: string, page = 1, limit = 20): string {
  return `tokens:list:${chain ?? 'all'}:${page}:${limit}`;
}

export function buildTokenKey(chain: string, address: string): string {
  return `tokens:${chain}:${address}`;
}

export async function connectRedis(): Promise<void> {
  try {
    await getRedis().connect();
    log.info('Redis connected');
  } catch (err) {
    log.warn('Redis connection failed, caching disabled', { error: String(err) });
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    if (client) {
      await client.quit();
      client = null;
    }
    if (subscriber) {
      await subscriber.quit();
      subscriber = null;
    }
  } catch {
    // ignore disconnect errors
  }
}

export const TOKEN_DISCOVERY_CHANNEL = 'token:discovery';
