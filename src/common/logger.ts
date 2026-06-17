import { getCurrentSpan } from '@elysia/opentelemetry';
import pino from 'pino';
import { getRequestId } from 'src/middleware/request-id';
import config from './config';

const isDev = config.NODE_ENV === 'development' || config.NODE_ENV === 'test';

// Tag every log line with the in-flight request's correlation ID and, when
// telemetry is on, its trace/span IDs — so a single line can be tied back to a
// request and to its trace. Returns nothing outside a request (startup, CLI).
function correlationBindings(): Record<string, string> {
  const bindings: Record<string, string> = {};

  const requestId = getRequestId();
  if (requestId) bindings.requestId = requestId;

  const span = getCurrentSpan();
  if (span) {
    const { traceId, spanId } = span.spanContext();
    if (traceId) {
      bindings.traceId = traceId;
      bindings.spanId = spanId;
    }
  }

  return bindings;
}

// Pretty logs only when a human is watching a TTY; structured JSON everywhere
// else (containers, pipes, CI). The pino-pretty worker transport also can't
// spawn inside a `bun build --compile` binary, so this keeps it production-safe.
const usePretty = isDev && Boolean(process.stdout.isTTY);

export const log = pino({
  level: config.LOG_LEVEL,
  mixin: correlationBindings,
  redact: [
    'password',
    '*.password',
    'token',
    '*.token',
    'authorization',
    '*.authorization',
    'cookie',
    '*.cookie',
    'req.headers.authorization',
    'req.headers.cookie',
  ],
  ...(usePretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l' },
        },
      }
    : { timestamp: pino.stdTimeFunctions.isoTime }),
});
