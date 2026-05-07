import pino from 'pino';
import config from './config';

const isDev = config.NODE_ENV === 'development' || config.NODE_ENV === 'test';

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
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l' },
        },
      }
    : { timestamp: pino.stdTimeFunctions.isoTime }),
});
