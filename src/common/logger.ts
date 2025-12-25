import pino from 'pino';
import config from './config';

export const log = pino({
  level: config.LOG_LEVEL,
  transport: ['development', 'test'].includes(config.NODE_ENV)
    ? {
        targets: [
          {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          },
        ],
      }
    : undefined,
});
