import { isNullOrUndefined } from '@raicamposs/toolkit';
import { ClauseBase } from '../core/clause-base';
import { PrimitiveValueTypes } from '../core/primitive-value';

export class ClauseLessThan extends ClauseBase {
  constructor(field: string, value: PrimitiveValueTypes) {
    super(field, value);
  }

  build() {
    if (!(this.value.isNumber() || this.value.isDate())) return undefined;

    const value = this.value.toSql();

    if (isNullOrUndefined(value)) return undefined;

    return `${this.field} < ${value}`;
  }
}
