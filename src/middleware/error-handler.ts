import { Elysia, ElysiaCustomStatusResponse, status } from 'elysia';
import { log as logger } from 'src/common/logger';

const log = logger.child({ name: 'error-handler' });

/**
 * Global error handling middleware
 * Catches all unhandled errors and logs them
 */
export const errorHandler = new Elysia({ name: 'error-handler' }).onError(
  ({ code, error, request }) => {
    // Return Elysia's handled errors as-is
    if (error instanceof ElysiaCustomStatusResponse || code !== 'UNKNOWN') {
      return error;
    }

    // Log unhandled errors
    log.error(
      {
        code,
        err: error,
        http: request
          ? {
              method: request.method,
              url: request.url,
              referrer: request.headers.get('referer') ?? undefined,
            }
          : undefined,
      },
      'Unhandled error',
    );

    // Do not expose unhandled errors to the client
    return status(500, 'Internal Server Error');
  },
);
