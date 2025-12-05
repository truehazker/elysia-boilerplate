import { log as logger } from 'src/common/logger';
import db from 'src/db';
import type { App } from 'src/main';

const log = logger.child({ name: 'graceful-shutdown' });

let isShuttingDown = false;

export async function gracefulShutdown(
  app: App,
  signal: NodeJS.Signals,
): Promise<void> {
  if (isShuttingDown) {
    log.warn('Already shutting down, ignoring signal');
    return;
  }

  isShuttingDown = true;

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
