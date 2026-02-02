import { z } from 'zod';
import { BaseParamSchema } from './base-params';

export const StringSchema = z.coerce.string().trim().min(1);

export const StringParamSchema = BaseParamSchema.pipe(
  z
    .object({
      in: StringSchema.array().nonempty().optional(),
      notIn: StringSchema.array().nonempty().optional(),
      contains: StringSchema.toUpperCase().optional(),
      equals: StringSchema.optional(),
      notEquals: StringSchema.optional(),
      notContains: StringSchema.toUpperCase().optional(),
    })
    .strict()
);

export type StringParam = z.infer<typeof StringParamSchema>;
