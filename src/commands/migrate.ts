import { log as logger } from 'src/common/logger';
import db, { migrateDb } from 'src/db';

const log = logger.child({ name: 'migrate' });

/**
 * One-shot migration. Drains the loop instead of calling `process.exit()`
 * (which truncates pino's transport); failure -> `process.exitCode`.
 */
export async function migrate(): Promise<void> {
  try {
    await migrateDb();
  } catch (err) {
    log.fatal({ err }, 'Migration failed');
    process.exitCode = 1;
  } finally {
    // Close the pool (open sockets keep the loop alive); bounded so a dead
    // DB can't stall the deploy.
    await db.$client.close({ timeout: 5 });
  }
}
