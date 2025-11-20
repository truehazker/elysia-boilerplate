import { defineConfig } from 'drizzle-kit';
import config from './src/common/config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './src/db/migrations',
  migrations: {
    prefix: 'timestamp',
  },
  dbCredentials: {
    url: config.DATABASE_URL,
  },
});
