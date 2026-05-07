import { drizzle } from 'drizzle-orm/bun-sql';
import { migrate } from 'drizzle-orm/bun-sql/migrator';
import { log as logger } from 'src/common/logger';
import config from '../common/config';

const log = logger.child({ name: 'db' });

const db = drizzle({
  connection: {
    url: config.DATABASE_DSN,
    max: config.DB_POOL_MAX,
    connectionTimeout: config.DB_POOL_CONNECTION_TIMEOUT,
    idleTimeout: config.DB_POOL_IDLE_TIMEOUT,
  },
  casing: 'snake_case',
});

/**
 * Run all pending database migrations.
 * @throws {Error} If migration fails (e.g., invalid SQL, connection issues)
 */
export async function migrateDb(): Promise<void> {
  log.info('Running database migrations...');
  try {
    await migrate(db, { migrationsFolder: 'src/db/migrations' });
    log.info('Database migrations completed successfully');
  } catch (error) {
    log.error({ error }, 'Database migration failed');
    throw error;
  }
}

export default db;
