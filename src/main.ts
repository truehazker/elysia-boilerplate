import cors from '@elysiajs/cors';
import openapi from '@elysiajs/openapi';
import { Elysia, ElysiaCustomStatusResponse, status } from 'elysia';
import config from './common/config';
import { log } from './common/logger';
import { users } from './modules/users';
import { gracefulShutdown } from './util/graceful-shutdown';

const app = new Elysia()
  .use(cors())
  .use(
    log.into({
      useLevel: config.LOG_LEVEL,
      autoLogging: false,
    }),
  )
  .onError(({ code, error, request }) => {
    // Return Elysia's handled errors as-is
    if (error instanceof ElysiaCustomStatusResponse || code !== 'UNKNOWN') {
      return error;
    }

    // Log unhandled errors
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
      'Unhandled error',
    );

    // Do not expose unhandled errors to the client
    return status(500, 'Internal Server Error');
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

export type App = typeof app;

process.once('SIGINT', () => gracefulShutdown(app, 'SIGINT'));
process.once('SIGTERM', () => gracefulShutdown(app, 'SIGTERM'));
