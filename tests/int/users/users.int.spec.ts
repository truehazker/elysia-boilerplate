import { describe, expect, it } from 'bun:test';
import { users as usersTable } from 'src/db/schema/users';
import { UsersService } from 'src/modules/users/service';
import { testDb } from '../setup';

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
    it('returns paginated users in deterministic creation order', async () => {
      for (let i = 0; i < 5; i++) {
        await UsersService.create({
          name: `User${i}`,
          surname: 'Test',
          email: `user${i}@example.com`,
        });
      }

      const page = await UsersService.get({ limit: 2, offset: 1 });
      expect(page.total).toBe(5);
      expect(page.users).toHaveLength(2);
      // Service orders by (createdAt, id) ascending, so offset=1 lands on
      // the second insert (user1) and the page covers user1, user2.
      expect(page.users.map((u) => u.email)).toEqual([
        'user1@example.com',
        'user2@example.com',
      ]);

      for (const u of page.users) {
        expect(u).toHaveProperty('id');
        expect(u).not.toHaveProperty('createdAt');
      }
    });

    it('returns empty list when no users exist', async () => {
      const page = await UsersService.get({ limit: 100, offset: 0 });
      expect(page.total).toBe(0);
      expect(page.users).toEqual([]);
    });
  });
});
