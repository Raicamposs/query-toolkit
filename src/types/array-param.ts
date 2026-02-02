import { z } from 'zod';
import { BoolSchema } from './bool-params';
import { DateSchema } from './date-params';
import { NumberSchema } from './number-params';
import { StringSchema } from './string-params';

export const ArrayBoolSchema = BoolSchema.array().nonempty().min(1);
export const ArrayDateSchema = DateSchema.array().nonempty().min(1);
export const ArrayNumberSchema = NumberSchema.array().nonempty().min(1);
export const ArrayStringSchema = StringSchema.array().nonempty().min(1);

export const ArrayBoolParamsSchema = z
  .object({
    arrayContains: ArrayBoolSchema.optional(),
    arrayIsContainedBy: ArrayBoolSchema.optional(),
    arrayOverlap: ArrayBoolSchema.optional(),
  })
  .strict();

export const ArrayDateParamsSchema = z
  .object({
    arrayContains: ArrayDateSchema.optional(),
    arrayIsContainedBy: ArrayDateSchema.optional(),
    arrayOverlap: ArrayDateSchema.optional(),
  })
  .strict();

export const ArrayNumberParamsSchema = z
  .object({
    arrayContains: ArrayNumberSchema.optional(),
    arrayIsContainedBy: ArrayNumberSchema.optional(),
    arrayOverlap: ArrayNumberSchema.optional(),
  })
  .strict();

export const ArrayStringParamsSchema = z
  .object({
    arrayContains: ArrayStringSchema.optional(),
    arrayIsContainedBy: ArrayStringSchema.optional(),
    arrayOverlap: ArrayStringSchema.optional(),
  })
  .strict();

export const ArrayParamsValuesSchema = z.union([
  ArrayBoolSchema,
  ArrayDateSchema,
  ArrayNumberSchema,
  ArrayStringSchema,
]);

export const ArrayParamsSchema = z.union([
  ArrayNumberParamsSchema,
  ArrayDateParamsSchema,
  ArrayBoolParamsSchema,
  ArrayStringParamsSchema,
]);
