import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';
import { errorHandler } from '../middleware/error-handler';
import { health } from '../modules/health/index';
import type { CheckResult } from '../modules/health/service';
import { HealthService } from '../modules/health/service';

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

    it('should not leak raw database error details', async () => {
      mockCheckDb.mockResolvedValueOnce({
        componentType: 'datastore',
        status: 'fail',
        time: '2026-03-22T10:00:00.000Z',
        output: 'Database is unreachable',
      });

      const response = await app.handle(new Request('http://localhost/ready'));
      const text = await response.text();
      expect(text).not.toContain('SELECT');
      expect(text).not.toContain('Failed query');
      expect(text).not.toContain('connection');
    });
  });
});
