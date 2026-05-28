import { InCondition } from '../../common/types';
import { PrimitiveValue, PrimitiveValueType } from '../../common/types/primitive-value';
import type { OperatorVisitor } from '../../converters';
import { QueryParamsOperator, QueryParamsOperatorSafeParse } from '../query-params-operator';

export class InOperator extends QueryParamsOperator<
  InCondition<PrimitiveValueType>,
  PrimitiveValueType[]
> {
  private stateValues: PrimitiveValue[];

  constructor(params: string) {
    super('in=', params);
    this.stateValues = PrimitiveValue.converterArray(this.getRawValue());
  }

  safeParse(): QueryParamsOperatorSafeParse<PrimitiveValueType[]> {
    if (this.isNullOrUndefined()) {
      return { success: false, error: `Invalid value for ${this.symbol} operator` };
    }
    if (!this.isArray()) {
      return { success: false, error: 'Expected array, got single value' };
    }
    return { success: true, value: this.value() };
  }

  value(): PrimitiveValueType[] {
    return this.stateValues
      .map((v) => v.getValue())
      .filter((v): v is PrimitiveValueType => v !== null && v !== undefined);
  }

  query(): InCondition<PrimitiveValueType> {
    return { in: this.value() };
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitIn(this, field);
  }
}
