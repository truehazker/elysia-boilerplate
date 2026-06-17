import { app } from 'src/app';
import config from 'src/common/config';
import { log as logger } from 'src/common/logger';
import { migrateDb } from 'src/db';
import { gracefulShutdown } from 'src/util/graceful-shutdown';

const log = logger.child({ name: 'serve' });

/**
 * Long-lived HTTP server. `DB_AUTO_MIGRATE` is a dev-only convenience — use
 * the `migrate` command in deployments (Drizzle's `migrate()` has no lock).
 */
export async function serve(): Promise<void> {
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
