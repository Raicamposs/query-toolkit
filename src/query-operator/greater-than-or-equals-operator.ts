import { isNullOrUndefined, Nullable } from '@raicamposs/toolkit';
import z from 'zod';
import { DateRsqlRegex } from '../common/date-regex';
import type { OperatorVisitor } from '../converters/operator-visitor';
import { RsqlCondition } from '../types';
import { QueryParamsOperator } from './query-params-operator';

export class GreaterThanOrEqualsOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('gte=', params);
  }

  value() {
    const [, value] = this.params.split(this.symbol);
    if (isNullOrUndefined(value)) return value;
    if (/^-?[0-9]+$/.test(value)) {
      return z.number().parse(value);
    }

    if (DateRsqlRegex.test(value)) {
      return z.coerce.date().parse(value);
    }

    return value;
  }

  query(): Nullable<RsqlCondition> {
    const value = this.value();
    if (isNullOrUndefined(value)) return value;
    return { gte: value } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitGreaterThanOrEquals(this, field);
  }
}
