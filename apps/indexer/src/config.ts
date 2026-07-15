export interface IndexerConfig {
  baseRpcUrl: string;
  databaseUrl: string;
  redisUrl: string;
  startBlock: number;
  backfillBlocks: number;
  backfillBatchSize: number;
  backfillDelayMs: number;
  pollIntervalMs: number;
}

export function loadConfig(): IndexerConfig {
  const baseRpcUrl = requireEnv('BASE_RPC_URL');
  const databaseUrl = requireEnv('DATABASE_URL');
  const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
  const startBlock = parseOptionalInt('START_BLOCK', 0);
  const backfillBlocks = parseOptionalInt('BACKFILL_BLOCKS', 0);
  const backfillBatchSize = parseOptionalInt('BACKFILL_BATCH_SIZE', 100);
  const backfillDelayMs = parseOptionalInt('BACKFILL_DELAY_MS', 500);
  const pollIntervalMs = parseOptionalInt('POLL_INTERVAL_MS', 12_000);

  if (pollIntervalMs < 1000) {
    throw new Error('POLL_INTERVAL_MS must be at least 1000');
  }

  return {
    baseRpcUrl,
    databaseUrl,
    redisUrl,
    startBlock,
    backfillBlocks,
    backfillBatchSize,
    backfillDelayMs,
    pollIntervalMs,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseOptionalInt(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw || raw.trim() === '') return defaultValue;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid integer for ${name}: "${raw}"`);
  }
  return parsed;
}
