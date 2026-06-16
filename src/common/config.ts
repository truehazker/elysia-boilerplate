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
   * Seconds to wait for a connection to be established before failing.
   * Bun.SQL `connectionTimeout`.
   */
  DB_POOL_CONNECTION_TIMEOUT: num({ default: 5 }),
  /**
   * Seconds an idle connection is kept in the pool before being closed.
   * Bun.SQL `idleTimeout`.
   */
  DB_POOL_IDLE_TIMEOUT: num({ default: 30 }),
  /**
   * Enable automatic database migrations on server startup.
   *
   * ⚠️ CAUTION: Disabled by default for safety.
   * - In production, run migrations via CI/CD pipelines instead.
   * - Enable in development/staging for convenience.
   * - If migrations fail, the server will NOT start.
   */
  DB_AUTO_MIGRATE: bool({ default: false }),
  // Drizzle migration files; relative to CWD. The Docker image ships this
  // folder so the default resolves against its WORKDIR.
  MIGRATIONS_DIR: str({ default: 'src/db/migrations' }),

  // Enable OpenAPI documentation to be available on /openapi route
  ENABLE_OPENAPI: bool({ default: true }),

  // Enable OpenTelemetry tracing. The exporter reads the standard
  // OTEL_EXPORTER_OTLP_* env vars; sampling is driven by OTEL_TRACES_SAMPLE_RATIO.
  OTEL_ENABLED: bool({ default: false }),

  // Span service.name. Defaults to the package name when empty.
  OTEL_SERVICE_NAME: str({ default: '' }),

  // Fraction of traces to sample, 0.0–1.0. Lower in production to control cost.
  OTEL_TRACES_SAMPLE_RATIO: num({ default: 1.0 }),
});

export default config;
