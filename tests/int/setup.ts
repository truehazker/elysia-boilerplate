/**
 * Integration test preload — runs once before any integration test file.
 *
 * Boots a single Postgres testcontainer, applies all Drizzle migrations,
 * and sets `DATABASE_DSN` BEFORE any application module is imported.
 * Test files can then use plain static imports (`import { UsersService }
 * from 'src/modules/users/service'`); by the time those modules load,
 * `src/db` constructs its singleton against the test container.
 *
 * Loaded via `bun test --preload <this-file>`. The `test:int` package
 * script wires this up. The preload also registers a global
 * `beforeEach(resetDatabase)` hook so individual specs don't have to.
 */

import { afterAll, beforeEach } from 'bun:test';
import path from 'node:path';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sql';
import { migrate } from 'drizzle-orm/bun-sql/migrator';
import { Wait } from 'testcontainers';

// Ryuk's wait-for-log strategy is incompatible with podman log streaming;
// rely on the cleanup hooks below instead. Override by exporting
// TESTCONTAINERS_RYUK_DISABLED=false on hosts where Ryuk works.
process.env.TESTCONTAINERS_RYUK_DISABLED ??= 'true';
process.env.NODE_ENV = 'test';

let container: StartedPostgreSqlContainer;
try {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('elysia_test')
    .withUsername('test')
    .withPassword('test')
    // Default wait strategy execs into the container; that hangs under some
    // podman setups. Log-message wait is portable across runtimes.
    .withWaitStrategy(
      Wait.forLogMessage(/database system is ready to accept connections/, 2),
    )
    .start();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  const hint = /ENOENT|ECONNREFUSED|connect/i.test(message)
    ? '\nIs Docker (or podman with the docker-compatible API) running?'
    : '';
  throw new Error(
    `Failed to start Postgres testcontainer.${hint}\n${message}`,
    { cause: err },
  );
}

const dsn = container.getConnectionUri();
process.env.DATABASE_DSN = dsn;

export const testDb = drizzle({
  connection: { url: dsn, max: 5, connectionTimeout: 5, idleTimeout: 30 },
  casing: 'snake_case',
});

const migrationsFolder = path.resolve(
  import.meta.dir,
  '../../src/db/migrations',
);
try {
  await migrate(testDb, { migrationsFolder });
} catch (err) {
  await container.stop().catch(() => {});
  throw err;
}

/**
 * Truncates every user-defined table in the `public` schema, restarting
 * identities and cascading FKs. Drizzle's own bookkeeping lives in the
 * `drizzle` schema and is left intact, so migrations never re-run.
 *
 * Use in `beforeEach` for full per-test isolation.
 */
export async function resetDatabase(): Promise<void> {
  const rows = (await testDb.execute(sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `)) as unknown as Array<{ tablename: string }>;
  if (rows.length === 0) return;
  // Use sql.identifier to safely quote table names — handles tables whose
  // names contain double quotes or other special characters.
  const targets = sql.join(
    rows.map((r) => sql.identifier(r.tablename)),
    sql.raw(', '),
  );
  await testDb.execute(sql`TRUNCATE TABLE ${targets} RESTART IDENTITY CASCADE`);
}

let stopped = false;
const STOP_TIMEOUT_MS = 10_000;

async function stopContainer(): Promise<void> {
  if (stopped) return;
  stopped = true;
  // Bound the wait so a hung container.stop() can't stall the runner
  // or block signal handlers from exiting.
  await Promise.race([
    container.stop().catch(() => {
      // best-effort cleanup; the container may already be gone
    }),
    new Promise<void>((resolve) => setTimeout(resolve, STOP_TIMEOUT_MS)),
  ]);
}

// Reset state before every test in every integration spec — registered
// here as a global hook so individual files don't have to remember it.
beforeEach(resetDatabase);

// bun:test fires this after the last test in the run completes.
afterAll(stopContainer);

// Belt-and-suspenders: covers cases where afterAll doesn't fire
// (e.g. process killed by a signal before the runner shuts down).
process.once('beforeExit', () => {
  void stopContainer();
});
process.once('SIGINT', () => {
  void stopContainer().then(() => process.exit(130));
});
process.once('SIGTERM', () => {
  void stopContainer().then(() => process.exit(143));
});

export { container };
