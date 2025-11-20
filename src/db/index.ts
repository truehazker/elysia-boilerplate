// Make sure to install the 'pg' package
import { drizzle } from 'drizzle-orm/node-postgres';
import config from '../common/config';

const db = drizzle({
  connection: {
    connectionString: config.DATABASE_URL,
    max: 10,
  },
  casing: 'snake_case',
});

export default db;
