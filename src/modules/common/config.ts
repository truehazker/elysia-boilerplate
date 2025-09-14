import { cleanEnv, port, str, url } from "envalid";

const config = cleanEnv(Bun.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'], default: 'development' }),
  LOG_LEVEL: str({ choices: ['info', 'debug', 'warn', 'error', 'fatal', 'trace', 'silent'], default: 'info' }),
  SERVER_HOSTNAME: str({ default: 'localhost' }),
  SERVER_PORT: port({ default: 3000 }),
  DATABASE_URL: url(),
})

export default config;
