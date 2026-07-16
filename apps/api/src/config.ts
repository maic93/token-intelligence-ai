import { loadApiConfig } from '@token-intelligence-ai/config';
import type { ApiEnv } from '@token-intelligence-ai/config';

export const config: ApiEnv = loadApiConfig(process.env);
