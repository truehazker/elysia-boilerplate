import cors from '@elysiajs/cors';
import openapi from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import config from './common/config';
import { log } from './common/logger';
import { migrateDb } from './db';
import { errorHandler } from './middleware/error-handler';
import { users } from './modules/users';
import { gracefulShutdown } from './util/graceful-shutdown';

const app = new Elysia()
  .use(cors())
  .use(errorHandler)
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
      enabled: config.ENABLE_OPENAPI,
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
    if (config.ENABLE_OPENAPI) {
      log.debug(
        `📚 OpenAPI documentation is available at http://${hostname}:${port}/openapi`,
      );
    } else {
      log.debug('📚 OpenAPI documentation is disabled');
    }
  });

  process.once('SIGINT', () => gracefulShutdown(app, 'SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown(app, 'SIGTERM'));
}

bootstrap().catch((error) => {
  log.fatal({ err: error }, 'Failed to start application');
  process.exit(1);
});

export type App = typeof app;
