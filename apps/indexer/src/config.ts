import { loadIndexerConfig } from '@token-intelligence-ai/config';
import type { IndexerEnv } from '@token-intelligence-ai/config';

export const config: IndexerEnv = loadIndexerConfig(process.env);
