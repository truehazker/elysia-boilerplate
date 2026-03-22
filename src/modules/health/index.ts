import { Elysia } from 'elysia';
import { log as logger } from 'src/common/logger';
import { type HealthModel, healthModelPlugin } from './model';
import { HealthService } from './service';

const log = logger.child({ name: 'health' });

const HEALTH_CONTENT_TYPE = 'application/health+json';

export const health = new Elysia({ tags: ['Health'] })
  .use(healthModelPlugin)
  .onAfterHandle(({ set, path }) => {
    if (path === '/health' || path === '/ready') {
      set.headers['content-type'] = HEALTH_CONTENT_TYPE;
    }
  })
  .get('/health', (): HealthModel.response => ({ status: 'pass' }), {
    response: { 200: 'health.response' },
    detail: {
      summary: 'Liveness check',
      description: 'Returns 200 if the server is running.',
    },
  })
  .get(
    '/ready',
    async ({ set }): Promise<HealthModel.response> => {
      const db = await HealthService.checkDb();
      const checks = { 'postgres:connectivity': [db] };

      if (db.status === 'fail') {
        log.error({ checks }, 'Readiness check failed');
        set.status = 503;
        return {
          status: 'fail',
          output: 'One or more dependencies are unavailable',
          checks,
        };
      }

      return { status: 'pass', checks };
    },
    {
      response: {
        200: 'health.response',
        503: 'health.response',
      },
      detail: {
        summary: 'Readiness check',
        description:
          'Returns 200 if the server is running and all dependencies are reachable.',
      },
    },
  );
