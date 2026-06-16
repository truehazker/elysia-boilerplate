import { AsyncLocalStorage } from 'node:async_hooks';
import { setAttributes } from '@elysia/opentelemetry';
import { Elysia } from 'elysia';

/**
 * Header carrying the correlation ID, inbound (from clients/proxies) and
 * outbound (echoed on every response). `x-request-id` is the de-facto standard
 * understood by most load balancers and tracing tools.
 */
export const REQUEST_ID_HEADER = 'x-request-id';

// Bound per request by the plugin below and read by the pino mixin in
// `src/common/logger`, so every log line is tagged with its request without
// threading context through service calls.
const requestContext = new AsyncLocalStorage<string>();

/** The correlation ID for the in-flight request, or `undefined` outside one. */
export const getRequestId = (): string | undefined => requestContext.getStore();

// HTTP already forbids control characters in header values, so a hostile inbound
// ID only needs a length cap to keep logs and spans from being bloated.
const MAX_REQUEST_ID_LENGTH = 128;

/** Reuse a sane inbound ID (so one ID spans services) or mint a fresh UUIDv7. */
function resolveRequestId(request: Request): string {
  const inbound = request.headers.get(REQUEST_ID_HEADER)?.trim();
  return inbound && inbound.length <= MAX_REQUEST_ID_LENGTH
    ? inbound
    : Bun.randomUUIDv7();
}

/**
 * Correlation-ID middleware. On every request it resolves an ID, binds it to an
 * AsyncLocalStorage scope (so every log line inherits it), echoes it on the
 * response header, and records it as the `request.id` span attribute — tying
 * logs to traces. Cross-service trace propagation itself rides on the W3C
 * `traceparent` header handled by the telemetry plugin.
 */
export const requestId = new Elysia({ name: 'request-id' }).onRequest(
  ({ request, set }) => {
    const id = resolveRequestId(request);

    requestContext.enterWith(id);
    set.headers[REQUEST_ID_HEADER] = id;
    setAttributes({ 'request.id': id }); // no-op when telemetry is disabled
  },
);
