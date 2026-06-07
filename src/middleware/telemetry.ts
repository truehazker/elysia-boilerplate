import { opentelemetry } from '@elysia/opentelemetry';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  NodeTracerProvider,
} from '@opentelemetry/sdk-trace-node';
import { Elysia } from 'elysia';
import config from 'src/common/config';
import { log as logger } from 'src/common/logger';
import pkg from '../../package.json';

const log = logger.child({ name: 'telemetry' });

// Own a traces-only provider and register it so @elysia/opentelemetry attaches
// here instead of starting its own NodeSDK (which would also leak an OTLP logs pipeline).
function setup() {
  if (!config.OTEL_ENABLED) {
    return {
      telemetry: new Elysia({ name: 'telemetry' }),
      shutdownTelemetry: () => Promise.resolve(),
    };
  }

  const serviceName = config.OTEL_SERVICE_NAME || pkg.name;

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      'service.name': serviceName,
      'service.version': pkg.version,
      'deployment.environment.name': config.NODE_ENV,
    }),
    spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
  });
  provider.register();

  return {
    telemetry: opentelemetry({ serviceName }),
    // Flush and close the pipeline; a hung or failed collector is logged, not thrown.
    shutdownTelemetry: () =>
      provider
        .shutdown()
        .catch((err) => log.warn({ err }, 'Telemetry shutdown failed')),
  };
}

export const { telemetry, shutdownTelemetry } = setup();
