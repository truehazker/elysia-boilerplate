import cors from '@elysia/cors';
import openapi from '@elysia/openapi';
import { Elysia } from 'elysia';
import { rateLimit } from 'elysia-rate-limit';
import packageJson from '../package.json';
import config from './common/config';
import { errorHandler } from './middleware/error-handler';
import { requestId } from './middleware/request-id';
import { telemetry } from './middleware/telemetry';
import { health } from './modules/health';
import { users } from './modules/users';

/**
 * The root Elysia application — all middleware and modules wired together.
 * Kept separate from the command modules (`commands/serve.ts` owns
 * bootstrap/listen) so tests can boot the real app via `app.handle()`
 * without starting an HTTP server.
 */
export const app = new Elysia({
  serve: { maxRequestBodySize: config.MAX_BODY_SIZE },
})
  .use(telemetry)
  .use(requestId)
  .use(cors())
  .use(
    rateLimit({
      max: config.RATE_LIMIT_MAX,
      duration: config.RATE_LIMIT_WINDOW * 1000,
    }),
  )
  .use(errorHandler)
  .use(
    openapi({
      documentation: {
        info: {
          title: 'Elysia Boilerplate',
          version: packageJson.version,
          description: 'A boilerplate service for Elysia',
        },
        servers: [
          {
            url: `http://${config.SERVER_HOSTNAME}:${config.SERVER_PORT}`,
            description: 'Local development server',
          },
        ],
      },
      enabled: config.ENABLE_OPENAPI,
    }),
  )
  .use(health)
  .use(users);

export type App = typeof app;
