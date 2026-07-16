import { z } from 'zod';

export const urlOrEmpty = z.string().optional().default('');

export const portSchema = z.coerce.number().int().positive().max(65535);

export const databaseUrlSchema = z.string().min(1, 'DATABASE_URL is required');

export const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']).default('info');
