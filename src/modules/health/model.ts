import Elysia, { t } from 'elysia';

const healthStatus = t.Union([
  t.Literal('pass'),
  t.Literal('fail'),
  t.Literal('warn'),
]);

const checkEntry = t.Object({
  componentId: t.Optional(t.String()),
  componentType: t.Optional(
    t.Union([
      t.Literal('component'),
      t.Literal('datastore'),
      t.Literal('system'),
    ]),
  ),
  observedValue: t.Optional(t.Any()),
  observedUnit: t.Optional(t.String()),
  status: t.Optional(healthStatus),
  affectedEndpoints: t.Optional(t.Array(t.String())),
  time: t.Optional(t.String({ format: 'date-time' })),
  output: t.Optional(t.String()),
  links: t.Optional(t.Record(t.String(), t.String())),
});

export namespace HealthModel {
  export const response = t.Object({
    status: healthStatus,
    version: t.Optional(t.String()),
    releaseId: t.Optional(t.String()),
    notes: t.Optional(t.Array(t.String())),
    output: t.Optional(t.String()),
    serviceId: t.Optional(t.String()),
    description: t.Optional(t.String()),
    checks: t.Optional(t.Record(t.String(), t.Array(checkEntry))),
    links: t.Optional(t.Record(t.String(), t.String())),
  });
  export type response = typeof response.static;
}

export const healthModelPlugin = new Elysia().model({
  'health.response': HealthModel.response,
});
