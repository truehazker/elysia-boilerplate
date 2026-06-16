import { app } from './app';
import config from './common/config';
import { log } from './common/logger';
import { migrateDb } from './db';
import { gracefulShutdown } from './util/graceful-shutdown';

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

export type { App } from './app';
