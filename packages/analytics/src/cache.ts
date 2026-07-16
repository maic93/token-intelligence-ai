import { createClient, type RedisClientType } from 'redis';
import { createLogger } from '@token-intelligence-ai/shared';
import type { ChainName } from '@token-intelligence-ai/blockchain';

const log = createLogger('analytics:cache');
const CACHE_TTL = 300;

export interface AnalyticsCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  buildKey(chain: ChainName, address: string): string;
}

class RedisAnalyticsCache implements AnalyticsCache {
  private readonly client: RedisClientType;
  private connected = false;

  constructor(url: string) {
    this.client = createClient({ url });
    this.client.on('error', (err) => log.error('Redis cache error', { error: String(err) }));
    this.client
      .connect()
      .then(() => {
        this.connected = true;
      })
      .catch(() => {
        this.connected = false;
      });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) return null;
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      log.info('Cache hit', { key });
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl = CACHE_TTL): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttl });
      log.info('Cache set', { key, ttl });
    } catch {
      log.warn('Cache set failed', { key });
    }
  }

  buildKey(chain: ChainName, address: string): string {
    return `analytics:${chain}:${address.toLowerCase()}`;
  }
}

class InMemoryAnalyticsCache implements AnalyticsCache {
  private readonly store = new Map<string, { data: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  async set<T>(key: string, value: T, ttl = CACHE_TTL): Promise<void> {
    this.store.set(key, { data: value, expiresAt: Date.now() + ttl * 1000 });
  }

  buildKey(chain: ChainName, address: string): string {
    return `analytics:${chain}:${address.toLowerCase()}`;
  }
}

export function createAnalyticsCache(redisUrl?: string): AnalyticsCache {
  if (redisUrl) {
    return new RedisAnalyticsCache(redisUrl);
  }
  return new InMemoryAnalyticsCache();
}
