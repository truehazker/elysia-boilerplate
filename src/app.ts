import cors from '@elysia/cors';
import openapi from '@elysia/openapi';
import { Elysia } from 'elysia';
import packageJson from '../package.json';
import config from './common/config';
import { errorHandler } from './middleware/error-handler';
import { telemetry } from './middleware/telemetry';
import { health } from './modules/health';
import { users } from './modules/users';

/**
 * The root Elysia application — all middleware and modules wired together.
 * Kept separate from the command modules (`commands/serve.ts` owns
 * bootstrap/listen) so tests can boot the real app via `app.handle()`
 * without starting an HTTP server.
 */
export const app = new Elysia()
  .use(telemetry)
  .use(cors())
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
