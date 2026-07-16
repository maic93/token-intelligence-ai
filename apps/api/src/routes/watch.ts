import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma, WatchRepository } from '@token-intelligence-ai/database';

const watchRepo = new WatchRepository(prisma);
const router: RouterType = Router();

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format');

router.get('/events', async (req, res, next) => {
  try {
    const query = listSchema.parse(req.query);
    const result = await watchRepo.getEvents({
      limit: query.limit,
      cursor: query.cursor,
    });

    res.json({
      data: result.items.map(formatEvent),
      nextCursor: result.nextCursor,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:address', async (req, res, next) => {
  try {
    const contractAddress = addressSchema.parse(req.params.address.toLowerCase());
    const query = listSchema.parse(req.query);

    const token = await prisma.token.findFirst({
      where: { contractAddress },
      select: { id: true },
    });

    if (!token) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    const result = await watchRepo.getEventsByToken(token.id, {
      limit: query.limit,
      cursor: query.cursor,
    });

    res.json({
      data: result.items.map(formatEvent),
      nextCursor: result.nextCursor,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatEvent(event: any) {
  return {
    id: event.id,
    eventType: event.eventType,
    message: event.message,
    metadata: event.metadata ?? {},
    createdAt:
      event.createdAt instanceof Date ? event.createdAt.toISOString() : String(event.createdAt),
    token: event.token ?? null,
  };
}

export { router as watchRouter };
