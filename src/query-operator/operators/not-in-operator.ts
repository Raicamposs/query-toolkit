import type { NotInCondition } from '../../common/types';
import type { PrimitiveValueType } from '../../common/types/primitive-value';
import { PrimitiveValue } from '../../common/types/primitive-value';
import type { OperatorVisitor } from '../../converters';
import type { QueryParamsOperatorSafeParse } from '../query-params-operator';
import { QueryParamsOperator } from '../query-params-operator';

export class NotInOperator extends QueryParamsOperator<
  NotInCondition<PrimitiveValueType>,
  PrimitiveValueType[]
> {
  private stateValues: PrimitiveValue[];

  constructor(params: string) {
    super('out=', params);
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

  query(): NotInCondition<PrimitiveValueType> {
    return { notIn: this.value() };
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitNotIn(this, field);
  }
}
