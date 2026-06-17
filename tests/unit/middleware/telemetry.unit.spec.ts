import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import { shutdownTelemetry, telemetry } from 'src/middleware/telemetry';

// OTEL is disabled in the test env, so these cover the no-op path that ships
// by default: the plugin must mount cleanly and shutdown must never throw.
describe('telemetry middleware (OTEL disabled)', () => {
  it('exposes a no-op Elysia plugin', () => {
    expect(telemetry).toBeInstanceOf(Elysia);
  });

  it('resolves shutdown without throwing', async () => {
    await expect(shutdownTelemetry()).resolves.toBeUndefined();
  });

  it('mounts on an app without affecting request handling', async () => {
    const app = new Elysia().use(telemetry).get('/', () => 'ok');
    const res = await app.handle(new Request('http://localhost/'));
    expect(await res.text()).toBe('ok');
  });
});
