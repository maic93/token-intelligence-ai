import { PrismaClient, Prisma } from '@prisma/client';
import type { WatchEventType } from '@token-intelligence-ai/shared';

export interface CreateWatchEventInput {
  tokenId: string;
  eventType: WatchEventType;
  message: string;
  metadata?: Prisma.InputJsonValue;
}

export interface WatchEventRecord {
  id: string;
  tokenId: string;
  eventType: string;
  message: string;
  metadata: Prisma.JsonValue;
  createdAt: Date;
}

export class WatchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createEvent(input: CreateWatchEventInput): Promise<WatchEventRecord> {
    return this.prisma.watchEvent.create({
      data: {
        tokenId: input.tokenId,
        eventType: input.eventType,
        message: input.message,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async getEvents(
    options: {
      limit?: number;
      cursor?: string;
    } = {},
  ): Promise<{ items: WatchEventRecord[]; nextCursor: string | null; total: number }> {
    const { limit = 50, cursor } = options;

    const total = await this.prisma.watchEvent.count();

    const findArgs: Prisma.WatchEventFindManyArgs = {
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        token: {
          select: { chain: true, contractAddress: true, name: true, symbol: true },
        },
      },
    };

    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    }

    const items = await this.prisma.watchEvent.findMany(findArgs);

    const hasMore = items.length > limit;
    if (hasMore) (items as typeof items).pop();

    return {
      items: items as WatchEventRecord[],
      nextCursor: hasMore ? items[items.length - 1].id : null,
      total,
    };
  }

  async getEventsByToken(
    tokenId: string,
    options: { limit?: number; cursor?: string } = {},
  ): Promise<{ items: WatchEventRecord[]; nextCursor: string | null; total: number }> {
    const { limit = 50, cursor } = options;

    const where: Prisma.WatchEventWhereInput = { tokenId };

    const total = await this.prisma.watchEvent.count({ where });

    const findArgs: Prisma.WatchEventFindManyArgs = {
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        token: {
          select: { chain: true, contractAddress: true, name: true, symbol: true },
        },
      },
    };

    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    }

    const items = await this.prisma.watchEvent.findMany(findArgs);

    const hasMore = items.length > limit;
    if (hasMore) (items as typeof items).pop();

    return {
      items: items as WatchEventRecord[],
      nextCursor: hasMore ? items[items.length - 1].id : null,
      total,
    };
  }

  async getRecentEvents(hours = 24): Promise<WatchEventRecord[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.prisma.watchEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        token: {
          select: { chain: true, contractAddress: true, name: true, symbol: true },
        },
      },
    });
  }
}
