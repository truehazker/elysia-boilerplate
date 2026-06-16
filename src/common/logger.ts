import pino from 'pino';
import config from './config';

const isDev = config.NODE_ENV === 'development' || config.NODE_ENV === 'test';

// Pretty logs only when a human is watching a TTY; structured JSON everywhere
// else (containers, pipes, CI). The pino-pretty worker transport also can't
// spawn inside a `bun build --compile` binary, so this keeps it production-safe.
const usePretty = isDev && Boolean(process.stdout.isTTY);

export const log = pino({
  level: config.LOG_LEVEL,
  redact: [
    'password',
    '*.password',
    'token',
    '*.token',
    'authorization',
    '*.authorization',
    'cookie',
    '*.cookie',
    'req.headers.authorization',
    'req.headers.cookie',
  ],
  ...(usePretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l' },
        },
      }
    : { timestamp: pino.stdTimeFunctions.isoTime }),
});
