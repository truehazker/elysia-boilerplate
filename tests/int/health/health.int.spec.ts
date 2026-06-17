import { describe, expect, it } from 'bun:test';
import { HealthService } from 'src/modules/health/service';

describe('HealthService (integration)', () => {
  it('returns pass when the database is reachable', async () => {
    const result = await HealthService.checkDb();
    expect(result.componentType).toBe('datastore');
    expect(result.status).toBe('pass');
    expect(typeof result.time).toBe('string');
    expect(result.output).toBeUndefined();
  });
});
