import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';
import db from 'src/db';
import { errorHandler } from 'src/middleware/error-handler';
import { health } from 'src/modules/health/index';
import type { CheckResult } from 'src/modules/health/service';
import { HealthService } from 'src/modules/health/service';

const originalCheckDb = HealthService.checkDb;

const mockCheckDb = mock<() => Promise<CheckResult>>(() =>
  Promise.resolve({
    componentType: 'datastore',
    status: 'pass',
    time: '2026-03-22T10:00:00.000Z',
  }),
);

Object.assign(HealthService, { checkDb: mockCheckDb });

const app = new Elysia().use(errorHandler).use(health);

describe('Health Module', () => {
  beforeEach(() => {
    mockCheckDb.mockClear();
  });

  describe('GET /health', () => {
    it('should return 200 with status pass', async () => {
      const response = await app.handle(new Request('http://localhost/health'));
      expect(response.status).toBe(200);

      const body = (await response.json()) as { status: string };
      expect(body.status).toBe('pass');
    });

    it('should return application/health+json content type', async () => {
      const response = await app.handle(new Request('http://localhost/health'));
      expect(response.headers.get('content-type')).toBe(
        'application/health+json',
      );
    });
  });

  describe('GET /ready', () => {
    it('should return 200 with checks when db is healthy', async () => {
      const response = await app.handle(new Request('http://localhost/ready'));
      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        status: string;
        checks: Record<string, { status: string }[]>;
      };
      expect(body.status).toBe('pass');
      expect(body.checks['postgres:connectivity']).toBeDefined();
      expect(body.checks['postgres:connectivity']?.[0]?.status).toBe('pass');
    });

    it('should return application/health+json content type', async () => {
      const response = await app.handle(new Request('http://localhost/ready'));
      expect(response.headers.get('content-type')).toBe(
        'application/health+json',
      );
    });

    it('should return 503 when db is unavailable', async () => {
      mockCheckDb.mockResolvedValueOnce({
        componentType: 'datastore',
        status: 'fail',
        time: '2026-03-22T10:00:00.000Z',
        output: 'Database is unreachable',
      });

      const response = await app.handle(new Request('http://localhost/ready'));
      expect(response.status).toBe(503);
      expect(response.headers.get('content-type')).toBe(
        'application/health+json',
      );

      const body = (await response.json()) as {
        status: string;
        output: string;
        checks: Record<string, { status: string; output?: string }[]>;
      };
      expect(body.status).toBe('fail');
      expect(body.output).toBe('One or more dependencies are unavailable');
      expect(body.checks['postgres:connectivity']?.[0]?.status).toBe('fail');
      expect(body.checks['postgres:connectivity']?.[0]?.output).toBe(
        'Database is unreachable',
      );
    });
  });
});

describe('HealthService.checkDb', () => {
  let originalExecute: typeof db.execute;

  beforeEach(() => {
    Object.assign(HealthService, { checkDb: originalCheckDb });
    originalExecute = db.execute;
  });

  afterEach(() => {
    db.execute = originalExecute;
    Object.assign(HealthService, { checkDb: mockCheckDb });
  });

  it('should return sanitized output when database is unreachable', async () => {
    // Stub db.execute to simulate a raw DB error
    db.execute = (() => {
      throw new Error(
        'connection refused (ECONNREFUSED): SELECT 1 failed at password authentication',
      );
    }) as typeof db.execute;

    const result = await HealthService.checkDb();
    expect(result.status).toBe('fail');
    expect(result.output).toBe('Database is unreachable');
    // Must not leak raw error details
    expect(result.output).not.toContain('SELECT');
    expect(result.output).not.toContain('ECONNREFUSED');
    expect(result.output).not.toContain('password');
  });
});
