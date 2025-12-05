import cors from '@elysiajs/cors';
import openapi from '@elysiajs/openapi';
import { Elysia, ElysiaCustomStatusResponse, status } from 'elysia';
import config from './common/config';
import { log } from './common/logger';
import { migrateDb } from './db';
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

/**
 * Bootstrap the application.
 * Runs all initialization tasks before starting the server.
 */
async function bootstrap(): Promise<void> {
  // Run database migrations before accepting any requests
  if (config.DB_AUTO_MIGRATE) {
    await migrateDb();
  }

  // Start the server only after all initialization is complete
  app.listen(config.SERVER_PORT, ({ development, hostname, port }) => {
    log.info(
      `🦊 Elysia is running at http://${hostname}:${port} ${development ? '🚧 in development mode!🚧' : ''}`,
    );
  });

  process.once('SIGINT', () => gracefulShutdown(app, 'SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown(app, 'SIGTERM'));
}

bootstrap().catch((error) => {
  log.fatal({ err: error }, 'Failed to start application');
  process.exit(1);
});

export type App = typeof app;
