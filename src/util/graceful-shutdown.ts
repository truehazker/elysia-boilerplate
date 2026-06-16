import type { App } from 'src/app';
import { log as logger } from 'src/common/logger';
import db from 'src/db';
import { shutdownTelemetry } from 'src/middleware/telemetry';

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

  let exitCode = 0;
  try {
    await app.stop();
    await db.$client.close();
  } catch (error) {
    exitCode = 1;
    log.error(error, `Error during ${signal} shutdown`);
  } finally {
    // Always flush traces, even on the failure path — those spans matter most.
    await shutdownTelemetry();
    clearTimeout(shutdownTimeout);
    process.exit(exitCode);
  }
}
