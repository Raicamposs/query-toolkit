import { z } from 'zod';

export const BaseParamSchema = z.any().transform((arg) => {
  if (arg instanceof Date) {
    return { equals: arg };
  }

  if (typeof arg === 'object') {
    return arg;
  }

  return { equals: arg };
});
