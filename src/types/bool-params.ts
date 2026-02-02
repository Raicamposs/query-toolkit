import { z } from 'zod';
import { BaseParamSchema } from './base-params';

export const boolTypesSchema = z.union([
  z.boolean(),
  z.enum(['true', 'false', 'TRUE', 'FALSE', 'True', 'False', 'S', 'N']),
]);

export const BoolSchema = boolTypesSchema.transform((bool: boolean | string) => {
  if (typeof bool === 'string') {
    return bool.toUpperCase() === 'TRUE' || bool.toUpperCase() === 'S';
  }
  return bool;
});

export const BoolParamSchema = BaseParamSchema.pipe(
  z
    .object({
      equals: BoolSchema.optional(),
      notEquals: BoolSchema.optional(),
      notIn: BoolSchema.array().nonempty().optional(),
      in: BoolSchema.array().nonempty().optional(),
    })
    .strict()
);

export const BoolOnlyEqualsParamSchema = BaseParamSchema.pipe(
  z
    .object({
      equals: BoolSchema.optional(),
      notEquals: BoolSchema.optional(),
    })
    .strict()
);

export type BoolParam = z.infer<typeof BoolParamSchema>;
