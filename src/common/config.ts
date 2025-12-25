import { bool, cleanEnv, port, str, url } from 'envalid';

const config = cleanEnv(Bun.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production', 'staging'],
    default: 'development',
  }),
  LOG_LEVEL: str({
    choices: ['info', 'debug', 'warn', 'error', 'fatal', 'trace', 'silent'],
    default: 'debug',
  }),
  SERVER_HOSTNAME: str({ default: 'localhost' }),
  SERVER_PORT: port({ default: 3000 }),
  DATABASE_URL: url(),
  /**
   * Enable automatic database migrations on server startup.
   *
   * ⚠️ CAUTION: Disabled by default for safety.
   * - In production, run migrations via CI/CD pipelines instead.
   * - Enable in development/staging for convenience.
   * - If migrations fail, the server will NOT start.
   */
  DB_AUTO_MIGRATE: bool({ default: false }),

  // Enable OpenAPI documentation to be available on /openapi route
  ENABLE_OPENAPI: bool({ default: true }),
});

export default config;
