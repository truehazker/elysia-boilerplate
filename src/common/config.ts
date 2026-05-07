import { bool, cleanEnv, num, port, str, url } from 'envalid';

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
  DATABASE_DSN: url(),
  /**
   * Maximum number of connections in the Drizzle/Bun.SQL pool.
   * Tune per-deployment based on Postgres `max_connections` and the
   * number of replicas of this service.
   */
  DB_POOL_MAX: num({ default: 10 }),
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
