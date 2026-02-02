import { z } from 'zod';
import {
  ArrayBoolParamsSchema,
  ArrayDateParamsSchema,
  ArrayNumberParamsSchema,
  ArrayStringParamsSchema,
  BoolParamSchema,
  DateParamSchema,
  NumberParamSchema,
  StringParamSchema,
} from './index';

export const RsqlConditionSchema = z.union([
  BoolParamSchema,
  DateParamSchema,
  NumberParamSchema,
  StringParamSchema,
  ArrayBoolParamsSchema,
  ArrayStringParamsSchema,
  ArrayDateParamsSchema,
  ArrayNumberParamsSchema,
]);

export type RsqlCondition = z.infer<typeof RsqlConditionSchema>;
