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
  .onError((ctx) => {
    log.error(ctx.error);
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
  .use(users)
  .listen(config.SERVER_PORT, ({ development, hostname, port }) => {
    log.info(
      `🦊 Elysia is running at ${hostname}:${port} ${development ? '🚧 in development mode!🚧' : ''}`,
    );
  });

process.once('SIGINT', () => {
  log.info('SIGINT received, shutting down...');
  app.stop();
  db.$client.end();
  process.exit(0);
});

process.once('SIGTERM', () => {
  log.info('SIGTERM received, shutting down...');
  app.stop();
  db.$client.end();
  process.exit(0);
});
