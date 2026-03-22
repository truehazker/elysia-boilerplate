import { sql } from 'drizzle-orm';
import { log as logger } from 'src/common/logger';
import db from 'src/db';

const log = logger.child({ name: 'health' });

export interface CheckResult {
  componentType: 'datastore' | 'component' | 'system';
  status: 'pass' | 'fail';
  time: string;
  output?: string;
}

export abstract class HealthService {
  static async checkDb(): Promise<CheckResult> {
    try {
      await db.execute(sql`SELECT 1`);
      return {
        componentType: 'datastore',
        status: 'pass',
        time: new Date().toISOString(),
      };
    } catch (err) {
      log.error({ err }, 'Database health check failed');
      return {
        componentType: 'datastore',
        status: 'fail',
        time: new Date().toISOString(),
        output: 'Database is unreachable',
      };
    }
  }
}
