import { log } from 'src/common/logger';
import db from 'src/db';
import type { App } from 'src/main';

export async function gracefulShutdown(
  app: App,
  signal: string,
): Promise<void> {
  log.info(`${signal} received, shutting down...`);

  const shutdownTimeout = setTimeout(() => {
    log.error('Shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, 10000); // 10 second timeout

  try {
    await app.stop();
    await db.$client.end();
    clearTimeout(shutdownTimeout);
    process.exit(0);
  } catch (error) {
    clearTimeout(shutdownTimeout);
    log.error(error, `Error during ${signal} shutdown`);
    process.exit(1);
  }
}
