import { z } from 'zod';
import { portSchema, databaseUrlSchema, logLevelSchema } from './shared.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: portSchema.default(4000),
  DATABASE_URL: databaseUrlSchema,
  REDIS_URL: z.string().optional().default(''),
  LOG_LEVEL: logLevelSchema,
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  CORS_ORIGIN: z.string().default('*'),
});

export type ApiEnv = z.infer<typeof envSchema>;

export function loadApiConfig(env: Record<string, string | undefined>): ApiEnv {
  return envSchema.parse(env);
}
