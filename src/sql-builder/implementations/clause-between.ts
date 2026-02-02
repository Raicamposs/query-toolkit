import { isEmpty, isNullOrUndefined } from '@raicamposs/toolkit';
import { Clause } from '../core/clause';
import { PrimitiveValue } from '../core/primitive-value';

export type BetweenParam = Date | string | number;

export class ClauseBetween extends Clause {
  private readonly start: PrimitiveValue;
  private readonly end: PrimitiveValue;

  constructor(
    private readonly field: string,
    start: BetweenParam,
    end: BetweenParam
  ) {
    super();
    if (isEmpty(this.field)) {
      throw new Error('Field is required');
    }
    this.start = new PrimitiveValue(start);
    this.end = new PrimitiveValue(end);
  }

  build() {
    const valueStart = this.start.toSql();
    const valueEnd = this.end.toSql();

    if (isNullOrUndefined(valueStart) || isNullOrUndefined(valueEnd)) return undefined;

    return `${this.field} BETWEEN ${valueStart} AND ${valueEnd}`;
  }
}
