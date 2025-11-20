import { createPinoLogger } from '@bogeychan/elysia-logger';
import config from './config';

export const log = createPinoLogger({
  level: config.LOG_LEVEL,
  transport:
    config.NODE_ENV === 'development'
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
