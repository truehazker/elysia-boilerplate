import { describe, expect, it } from 'bun:test';
import { migrateDb } from 'src/db';
import { users as usersTable } from 'src/db/schema/users';
import { testDb } from '../../support/setup';

describe('Database migrations (integration)', () => {
  // Call migrateDb() directly — the `migrate` command would close the shared pool.
  it('re-running against a migrated database succeeds (idempotent)', async () => {
    expect(await migrateDb()).toBeUndefined();
  });

  it('has applied the users table schema', async () => {
    const rows = await testDb.select().from(usersTable);
    expect(Array.isArray(rows)).toBe(true);
  });
});
