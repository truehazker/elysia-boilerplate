import { t } from 'elysia';

export const errorResponse = <T extends string>(message: T) =>
  t.Object({
    message: t.Literal(message),
  });
