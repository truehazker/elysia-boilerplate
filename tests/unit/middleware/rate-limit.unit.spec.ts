import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test';
import { Elysia } from 'elysia';
import { rateLimiter } from 'src/middleware/rate-limit';

const req = (path: string) => new Request(`http://localhost${path}`);
const remaining = (res: Response) => {
  const header = res.headers.get('RateLimit-Remaining');
  // Absent header -> NaN, not Number(null) === 0, so presence checks hold.
  return header === null ? Number.NaN : Number(header);
};

// `app.handle` has no bound server, so the default IP generator warns on every
// request. Silence the test-only noise.
let warnSpy: ReturnType<typeof spyOn>;
beforeAll(() => {
  warnSpy = spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => warnSpy.mockRestore());

describe('rate-limit middleware', () => {
  it('limits the module it is mounted on, not its siblings', async () => {
    const app = new Elysia()
      .use(new Elysia().get('/health', () => 'ok'))
      .use(
        new Elysia({ prefix: '/users' }).use(rateLimiter).get('/', () => 'ok'),
      );

    const first = await app.handle(req('/users'));
    expect(first.status).toBe(200);
    expect(Number.isNaN(remaining(first))).toBe(false);

    // Sibling has no limiter and must not consume the module's budget.
    for (let i = 0; i < 5; i++) {
      const health = await app.handle(req('/health'));
      expect(health.status).toBe(200);
      expect(health.headers.get('RateLimit-Remaining')).toBeNull();
    }

    // Budget dropped by exactly one — the sibling traffic did not count.
    expect(remaining(await app.handle(req('/users')))).toBe(
      remaining(first) - 1,
    );
  });
});
