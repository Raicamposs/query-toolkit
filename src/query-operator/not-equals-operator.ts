import { Nullable } from '@raicamposs/toolkit';
import { parseRsqlValue } from '../common/date-parser';
import { OperatorVisitor } from '../converters';
import { RsqlCondition } from '../types';
import { QueryParamsOperator } from './query-params-operator';

export class NotEqualsOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('!=', params);
  }

  value() {
    return parseRsqlValue(this.getRawValue()) as any;
  }

  query(): Nullable<RsqlCondition> {
    return { notEquals: this.value() } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitNotEquals(this, field);
  }
}
