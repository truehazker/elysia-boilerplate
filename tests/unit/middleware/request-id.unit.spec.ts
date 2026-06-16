import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import {
  getRequestId,
  REQUEST_ID_HEADER,
  requestId,
} from 'src/middleware/request-id';

// Minimal app exposing the in-context request ID so we can assert that what the
// handler sees matches what the response advertises. The `/interleave` route
// reads the ID across an await to prove the AsyncLocalStorage context is not
// clobbered by other in-flight requests.
const app = new Elysia()
  .use(requestId)
  .get('/probe', () => ({ id: getRequestId() ?? null }))
  .get('/interleave', async () => {
    const before = getRequestId();
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { before, after: getRequestId() };
  })
  // Re-reads the ID across a microtask and a variable timer so that requests
  // resume in a different order than they started — the worst case for context
  // bleed. Reports the ID seen at each step.
  .get('/work', async ({ query }) => {
    const start = getRequestId();
    await Promise.resolve();
    const afterMicrotask = getRequestId();
    await new Promise((resolve) =>
      setTimeout(resolve, Number(query.delay) || 0),
    );
    const afterTimer = getRequestId();
    return { start, afterMicrotask, afterTimer };
  });

const probe = (headers?: Record<string, string>) =>
  app.handle(new Request('http://localhost/probe', { headers }));

describe('request-id middleware', () => {
  it('generates an ID when none is supplied and echoes it on the response', async () => {
    const response = await probe();
    const header = response.headers.get(REQUEST_ID_HEADER);
    const body = (await response.json()) as { id: string | null };

    expect(header).toBeTruthy();
    expect(body.id).toBe(header);
  });

  it('reuses a valid inbound ID so it can span services', async () => {
    const incoming = 'edge-7f3c2a1b';
    const response = await probe({ [REQUEST_ID_HEADER]: incoming });
    const body = (await response.json()) as { id: string | null };

    expect(response.headers.get(REQUEST_ID_HEADER)).toBe(incoming);
    expect(body.id).toBe(incoming);
  });

  it('discards an over-long inbound ID in favour of a generated one', async () => {
    const hostile = 'x'.repeat(200);
    const response = await probe({ [REQUEST_ID_HEADER]: hostile });
    const header = response.headers.get(REQUEST_ID_HEADER);

    expect(header).not.toBe(hostile);
    expect(header?.length).toBeLessThanOrEqual(128);
  });

  it('issues a distinct ID per request', async () => {
    const [first, second] = await Promise.all([probe(), probe()]);

    expect(first.headers.get(REQUEST_ID_HEADER)).not.toBe(
      second.headers.get(REQUEST_ID_HEADER),
    );
  });

  it('keeps each request context isolated across awaits', async () => {
    const call = (id: string) =>
      app
        .handle(
          new Request('http://localhost/interleave', {
            headers: { [REQUEST_ID_HEADER]: id },
          }),
        )
        .then((r) => r.json() as Promise<{ before: string; after: string }>);

    const [a, b] = await Promise.all([call('req-AAA'), call('req-BBB')]);

    expect(a).toEqual({ before: 'req-AAA', after: 'req-AAA' });
    expect(b).toEqual({ before: 'req-BBB', after: 'req-BBB' });
  });

  it('returns no request ID outside of a request', () => {
    expect(getRequestId()).toBeUndefined();
  });
});

describe('request-id middleware under load', () => {
  it('generates collision-free IDs across thousands of concurrent requests', async () => {
    const N = 5000;
    const responses = await Promise.all(
      Array.from({ length: N }, () => probe()),
    );
    const ids = responses.map((r) => r.headers.get(REQUEST_ID_HEADER));

    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(
      true,
    );
    expect(new Set(ids).size).toBe(N);
  });

  it('keeps every concurrent request bound to its own ID across awaits', async () => {
    const N = 1000;
    const results = await Promise.all(
      Array.from({ length: N }, (_, i) => {
        const id = `req-${i}`;
        // Reverse-correlated delay so request 0 resumes last: maximal interleave.
        const delay = (N - i) % 13;
        return app
          .handle(
            new Request(`http://localhost/work?delay=${delay}`, {
              headers: { [REQUEST_ID_HEADER]: id },
            }),
          )
          .then(async (r) => ({
            id,
            header: r.headers.get(REQUEST_ID_HEADER),
            body: (await r.json()) as {
              start: string;
              afterMicrotask: string;
              afterTimer: string;
            },
          }));
      }),
    );

    for (const { id, header, body } of results) {
      expect(header).toBe(id);
      expect(body.start).toBe(id);
      expect(body.afterMicrotask).toBe(id);
      expect(body.afterTimer).toBe(id);
    }
  });

  it('never leaks a request ID into a background task running outside any request', async () => {
    // A timer scheduled from outside any request must observe `undefined` even
    // while a burst of requests is in flight — proving the per-request scope
    // can't bleed into unrelated async work.
    const observed = await new Promise<string | undefined>((resolve) => {
      setTimeout(() => resolve(getRequestId()), 10);

      void Promise.all(
        Array.from({ length: 200 }, () =>
          app.handle(
            new Request('http://localhost/probe', {
              headers: { [REQUEST_ID_HEADER]: 'background-leak-probe' },
            }),
          ),
        ),
      );
    });

    expect(observed).toBeUndefined();
  });
});
