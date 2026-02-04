import { Nullable } from '@raicamposs/toolkit';
import { parseRsqlValue } from '../common/date-parser';
import { OperatorVisitor } from '../converters';
import { RsqlCondition } from '../types';
import { QueryParamsOperator } from './query-params-operator';

export class NotInOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('out=', params);
  }

  value() {
    return this.getRawValue()
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '')
      .map((item) => parseRsqlValue(item) as any);
  }

  query(): Nullable<RsqlCondition> {
    return { notIn: this.value() } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitNotIn(this, field);
  }
}
