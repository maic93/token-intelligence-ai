export { createLogger } from './logger.js';
export type { Logger, LogLevel } from './logger.js';

export interface AppConfig {
  environment: string;
  port: number;
}

export function createAppConfig(environment: string, port: number): AppConfig {
  return {
    environment,
    port,
  };
}
