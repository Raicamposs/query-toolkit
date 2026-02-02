import { isNullOrUndefined } from '@raicamposs/toolkit';
import { ClauseBase } from '../core/clause-base';
import { PrimitiveArrayValue } from '../core/primitive-array-value';
import { PrimitiveValueTypes } from '../core/primitive-value';

export class ClauseArrayIsContainedBy extends ClauseBase {
  private readonly arrayValue: PrimitiveArrayValue;

  constructor(field: string, value: PrimitiveValueTypes[]) {
    super(field, value[0]);
    this.arrayValue = new PrimitiveArrayValue(value);
  }

  build() {
    const value = this.arrayValue.toSql();
    if (isNullOrUndefined(value)) return undefined;
    return `${this.field} <@ ARRAY[${value}]`;
  }
}
