import { createPinoLogger } from '@bogeychan/elysia-logger';
import config from './config';

export const log = createPinoLogger({
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
