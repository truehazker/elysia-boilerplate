import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { log as logger } from 'src/common/logger';
import config from '../common/config';

const log = logger.child({ name: 'db' });

const db = drizzle({
  connection: {
    connectionString: config.DATABASE_URL,
    max: 10,
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
