import config from "./src/common/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './src/db/migrations',
  migrations: {
    prefix: 'timestamp'
  },
  dbCredentials: {
    url: config.DATABASE_URL
  }
})
