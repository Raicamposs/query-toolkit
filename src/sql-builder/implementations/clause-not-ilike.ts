import { isNullOrUndefined } from '@raicamposs/toolkit';
import { ClauseBase } from '../core/clause-base';
import { PrimitiveValueTypes } from '../core/primitive-value';

export class ClauseNotILike extends ClauseBase {
  constructor(field: string, value: PrimitiveValueTypes) {
    super(field, value);
  }

  build() {
    const value = this.value.toSql();
    if (isNullOrUndefined(value)) return undefined;
    return `${this.field} NOT ILIKE ${value}`;
  }
}
