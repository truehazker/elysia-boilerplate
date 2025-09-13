import config from "@/modules/common/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './drizzle',
  dbCredentials: {
    url: config.DATABASE_URL
  }
})

