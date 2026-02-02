import { z } from 'zod';
import { BaseParamSchema } from './base-params';

export const UuidSchema = z.uuid().trim();

export const UuidParamSchema = BaseParamSchema.pipe(
  z
    .object({
      in: UuidSchema.array().nonempty().optional(),
      notIn: UuidSchema.array().nonempty().optional(),
      contains: UuidSchema.optional(),
      equals: UuidSchema.optional(),
      notEquals: UuidSchema.optional(),
      notContains: UuidSchema.optional(),
    })
    .strict()
);

export type UuidParam = z.infer<typeof UuidParamSchema>;
