import { rateLimit } from 'elysia-rate-limit';
import config from 'src/common/config';

// Per-IP limiter, opt-in per module via `.use()` (scoped, never global).
export const rateLimiter = rateLimit({
  scoping: 'scoped',
  max: config.RATE_LIMIT_MAX,
  duration: config.RATE_LIMIT_WINDOW * 1000,
});
