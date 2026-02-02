import { Nullable } from '@raicamposs/toolkit';
import z from 'zod';
import type { OperatorVisitor } from '../converters/operator-visitor';
import { BoolSchema, DateSchema, NumberSchema, RsqlCondition, StringSchema } from '../types';
import { QueryParamsOperator } from './query-params-operator';

export class NotInOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('out=', params);
  }

  value() {
    const filters = this.getRawValue()
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');

    const data = z
      .union([BoolSchema, NumberSchema, DateSchema, StringSchema])
      .array()
      .parse(filters);
    return data;
  }

  query(): Nullable<RsqlCondition> {
    return { notIn: this.value() } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitNotIn(this, field);
  }
}
