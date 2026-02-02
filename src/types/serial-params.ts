import { z } from 'zod';
import { BaseParamSchema } from './base-params';
import { NumberSchema } from './number-params';

export const SerialSchema = NumberSchema.pipe(z.number().positive().min(1));

export const SerialParamSchema = BaseParamSchema.pipe(
  z
    .object({
      equals: SerialSchema.optional(),
      notEquals: SerialSchema.optional(),
      gt: SerialSchema.optional(),
      gte: SerialSchema.optional(),
      lt: SerialSchema.optional(),
      lte: SerialSchema.optional(),
      in: SerialSchema.array().nonempty().optional(),
      notIn: SerialSchema.array().nonempty().optional(),
    })
    .strict()
);

export const SerialOnlyEqualsOrInParamSchema = BaseParamSchema.pipe(
  z
    .object({
      equals: SerialSchema.optional(),
      notEquals: SerialSchema.optional(),
      in: SerialSchema.array().nonempty().optional(),
      notIn: SerialSchema.array().nonempty().optional(),
    })
    .strict()
);
