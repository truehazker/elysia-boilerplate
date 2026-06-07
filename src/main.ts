import cors from '@elysia/cors';
import openapi from '@elysia/openapi';
import { Elysia } from 'elysia';
import packageJson from '../package.json';
import config from './common/config';
import { log } from './common/logger';
import { migrateDb } from './db';
import { errorHandler } from './middleware/error-handler';
import { telemetry } from './middleware/telemetry';
import { health } from './modules/health';
import { users } from './modules/users';
import { gracefulShutdown } from './util/graceful-shutdown';

const app = new Elysia()
  .use(telemetry)
  .use(cors())
  .use(errorHandler)
  .use(
    openapi({
      documentation: {
        info: {
          title: 'Elysia Boilerplate',
          version: packageJson.version,
          description: 'A boilerplate service for Elysia',
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
  .use(health)
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
  app.listen(
    { port: config.SERVER_PORT, hostname: config.SERVER_HOSTNAME },
    ({ development, hostname, port }) => {
      log.info(
        { host: hostname, port, development },
        `Elysia is running at http://${hostname}:${port}`,
      );
      if (config.ENABLE_OPENAPI) {
        log.info(
          { url: `http://${hostname}:${port}/openapi` },
          'OpenAPI documentation available',
        );
      }
    },
  );

  process.once('SIGINT', () => gracefulShutdown(app, 'SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown(app, 'SIGTERM'));
}

bootstrap().catch((error) => {
  log.fatal({ err: error }, 'Failed to start application');
  process.exit(1);
});

export type App = typeof app;
