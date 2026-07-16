export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export interface LoggerOptions {
  service: string;
  level?: LogLevel;
  requestId?: string;
}

export interface Logger {
  debug(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  child(overrides: Partial<LoggerOptions>): Logger;
}

function isPretty(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

const LEVEL_PAD: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR',
};

export function createLogger(service: string, opts?: { level?: LogLevel }): Logger {
  const minLevel = opts?.level ?? (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';
  const minRank = LEVEL_RANK[minLevel] ?? 1;

  function shouldLog(level: LogLevel): boolean {
    return LEVEL_RANK[level] >= minRank;
  }

  function log(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
    if (!shouldLog(level)) return;

    const entry: Record<string, unknown> = {
      level,
      msg,
      service,
      timestamp: formatTimestamp(),
      ...data,
    };

    if (isPretty()) {
      const ts = entry.timestamp as string;
      const reqId = entry.requestId ? ` [${entry.requestId as string}]` : '';
      const extra = data
        ? ' ' +
          Object.entries(data)
            .filter(([k]) => k !== 'requestId')
            .map(([k, v]) => {
              if (v instanceof Error) return `${k}=${v.message}`;
              try {
                return `${k}=${JSON.stringify(v)}`;
              } catch {
                return `${k}=${String(v)}`;
              }
            })
            .join(' ')
        : '';
      const line = `[${ts}] [${LEVEL_PAD[level]}] [${service}]${reqId} ${msg}${extra}`;
      if (level === 'error') process.stderr.write(line + '\n');
      else process.stdout.write(line + '\n');
    } else {
      if (entry.error instanceof Error) {
        const err = entry.error as Error;
        entry.error = err.message;
        entry.stack = err.stack;
      }
      const line = JSON.stringify(entry);
      if (level === 'error') process.stderr.write(line + '\n');
      else process.stdout.write(line + '\n');
    }
  }

  function child(overrides: Partial<LoggerOptions>): Logger {
    return createLogger(overrides.service ?? service, {
      level: overrides.level ?? minLevel,
    });
  }

  return {
    debug: (msg, data) => log('debug', msg, data),
    info: (msg, data) => log('info', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    error: (msg, data) => log('error', msg, data),
    child,
  };
}
