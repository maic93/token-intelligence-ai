import { z } from 'zod';
import { databaseUrlSchema, logLevelSchema } from './shared.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: databaseUrlSchema,
  REDIS_URL: z.string().optional().default(''),
  START_BLOCK: z.coerce.number().int().nonnegative().default(0),
  BACKFILL_BLOCKS: z.coerce.number().int().nonnegative().default(0),
  POLL_INTERVAL_MS: z.coerce.number().int().min(1000).default(12_000),
  LOG_LEVEL: logLevelSchema,
});

export type IndexerEnv = z.infer<typeof envSchema>;

export function loadIndexerConfig(env: Record<string, string | undefined>): IndexerEnv {
  return envSchema.parse(env);
}
