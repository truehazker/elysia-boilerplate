import { describe, expect, it } from 'bun:test';
import { app } from 'src/app';

// Full-stack e2e: drives the real app (routing, validation, error handler,
// service, DB) via app.handle against the Postgres testcontainer booted by
// the integration preload. The preload's beforeEach(resetDatabase) gives each
// test a clean schema, so cases stay independent of order.

const post = (body: unknown) =>
  app.handle(
    new Request('http://localhost/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

describe('Users routes (e2e)', () => {
  it('creates a user and returns it from the listing', async () => {
    const created = await post({
      name: 'Ada',
      surname: 'Lovelace',
      email: 'ada@example.com',
    });
    expect(created.status).toBe(200);
    expect(await created.json()).toMatchObject({
      name: 'Ada',
      surname: 'Lovelace',
      email: 'ada@example.com',
    });

    const list = await app.handle(new Request('http://localhost/users'));
    expect(list.status).toBe(200);
    const body = (await list.json()) as {
      total: number;
      users: { email: string }[];
    };
    expect(body.total).toBe(1);
    expect(body.users[0]?.email).toBe('ada@example.com');
  });

  it('rejects a duplicate email with 409', async () => {
    const email = 'dupe@example.com';
    await post({ name: 'Seed', surname: 'User', email });

    const dup = await post({ name: 'Augusta', surname: 'King', email });
    expect(dup.status).toBe(409);
  });

  it('rejects an invalid body with 400', async () => {
    const res = await post({ name: 'No Email' });
    expect(res.status).toBe(400);
  });
});
