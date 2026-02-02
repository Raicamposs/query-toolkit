import { isNullOrUndefined } from '@raicamposs/toolkit';
import { ClauseBase } from '../core/clause-base';

export class ClauseLike extends ClauseBase {
  constructor(field: string, value: string) {
    super(field, value);
  }

  build() {
    const value = this.value.toSql();
    if (isNullOrUndefined(value)) return undefined;
    if (!this.value.isString()) return undefined;
    return `${this.field} LIKE ${value}`;
  }
}
