import { describe, expect, it } from 'bun:test';
import { users as usersTable } from 'src/db/schema/users';
import { UsersService } from 'src/modules/users/service';
import { testDb } from '../../support/setup';

describe('UsersService (integration)', () => {
  describe('create', () => {
    it('persists a new user and returns the created row', async () => {
      const created = await UsersService.create({
        name: 'Jane',
        surname: 'Doe',
        email: 'jane.doe@example.com',
      });

      expect(created).not.toBeNull();
      expect(created?.id).toBeString();
      expect(created).toMatchObject({
        name: 'Jane',
        surname: 'Doe',
        email: 'jane.doe@example.com',
      });

      const rows = await testDb.select().from(usersTable);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.email).toBe('jane.doe@example.com');
    });

    it('returns null when email already exists (unique constraint)', async () => {
      await UsersService.create({
        name: 'First',
        surname: 'Owner',
        email: 'dupe@example.com',
      });

      const second = await UsersService.create({
        name: 'Second',
        surname: 'Attempt',
        email: 'dupe@example.com',
      });

      expect(second).toBeNull();

      const rows = await testDb.select().from(usersTable);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.name).toBe('First');
    });
  });

  describe('get', () => {
    it('walks all users via the cursor in deterministic creation order', async () => {
      for (let i = 0; i < 5; i++) {
        await UsersService.create({
          name: `User${i}`,
          surname: 'Test',
          email: `user${i}@example.com`,
        });
      }

      const first = await UsersService.get({ limit: 2 });
      expect(first.users.map((u) => u.email)).toEqual([
        'user0@example.com',
        'user1@example.com',
      ]);
      expect(first.nextCursor).toBeString();

      const second = await UsersService.get({
        limit: 2,
        cursor: first.nextCursor ?? undefined,
      });
      expect(second.users.map((u) => u.email)).toEqual([
        'user2@example.com',
        'user3@example.com',
      ]);

      // Last partial page: fewer rows than the limit, so the cursor terminates.
      const third = await UsersService.get({
        limit: 2,
        cursor: second.nextCursor ?? undefined,
      });
      expect(third.users.map((u) => u.email)).toEqual(['user4@example.com']);
      expect(third.nextCursor).toBeNull();

      for (const u of first.users) {
        expect(u).toHaveProperty('id');
        expect(u).not.toHaveProperty('createdAt');
      }
    });

    it('walks every row exactly once across pages — no skips or dupes', async () => {
      // Regression: a millisecond-truncated cursor re-emitted the boundary row.
      for (let i = 0; i < 7; i++) {
        await UsersService.create({
          name: `User${i}`,
          surname: 'Test',
          email: `user${i}@example.com`,
        });
      }

      const seen: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await UsersService.get({ limit: 2, cursor });
        seen.push(...page.users.map((u) => u.email));
        cursor = page.nextCursor ?? undefined;
      } while (cursor);

      expect(seen).toEqual([
        'user0@example.com',
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
        'user4@example.com',
        'user5@example.com',
        'user6@example.com',
      ]);
      expect(new Set(seen).size).toBe(7);
    });

    it('returns empty list when no users exist', async () => {
      const page = await UsersService.get({ limit: 100 });
      expect(page.users).toEqual([]);
      expect(page.nextCursor).toBeNull();
    });
  });
});
