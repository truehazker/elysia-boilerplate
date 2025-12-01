import cors from '@elysiajs/cors';
import openapi from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import config from './common/config';
import { log } from './common/logger';
import db from './db';
import { users } from './modules/users';

const app = new Elysia()
  .use(cors())
  .use(
    log.into({
      useLevel: config.LOG_LEVEL,
      autoLogging: false,
    }),
  )
  .onError(({ code, error, request }) => {
    log.error(
      {
        code,
        err: error,
        http: request
          ? {
              method: request.method,
              url: request.url,
              referrer: request.headers.get('referer') ?? undefined,
            }
          : undefined,
      },
      'Unhandled request error',
    );
    return error;
  })
  .use(
    openapi({
      documentation: {
        info: {
          title: 'Elysia Boilerplate',
          version: '0.1.5',
          description: 'A simple boilerplate service for Elysia',
        },
        servers: [
          {
            url: `http://${config.SERVER_HOSTNAME}:${config.SERVER_PORT}`,
            description: 'Local development server',
          },
        ],
      },
    }),
  )
  .use(users);

app.listen(config.SERVER_PORT, ({ development, hostname, port }) => {
  log.info(
    `🦊 Elysia is running at ${hostname}:${port} ${development ? '🚧 in development mode!🚧' : ''}`,
  );
});

process.once('SIGINT', async () => {
  log.info('SIGINT received, shutting down...');
  await app.stop();
  await db.$client.end();
  process.exit(0);
});

process.once('SIGTERM', async () => {
  log.info('SIGTERM received, shutting down...');
  await app.stop();
  await db.$client.end();
  process.exit(0);
});
