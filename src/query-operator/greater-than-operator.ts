import { Nullable } from '@raicamposs/toolkit';
import { parseRsqlDate } from '../common/date-parser';
import type { OperatorVisitor } from '../converters/operator-visitor';
import { RsqlCondition } from '../types';
import { QueryParamsOperator } from './query-params-operator';

export class GreaterThanOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('gt=', params);
  }

  value() {
    return parseRsqlDate(this.getRawValue());
  }

  query(): Nullable<RsqlCondition> {
    return { gt: this.value() } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitGreaterThan(this, field);
  }
}
