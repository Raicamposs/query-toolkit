import { isEmpty, isNullOrUndefined } from '@raicamposs/toolkit';
import { Clause } from '../core/clause';

export class ClauseOr extends Clause {
  private readonly value: Clause[] = [];
  constructor(...clauses: Clause[]) {
    super();
    this.value.push(...clauses);
  }

  addClause(clause: Clause) {
    this.value.push(clause);
    return this;
  }

  build() {
    if (isNullOrUndefined(this.value) || this.value.length === 0) return undefined;

    const where = this.value
      .map((clause) => clause.build())
      .filter((clause) => isEmpty(clause) === false)
      .join(' or ');

    if (isEmpty(where)) {
      return undefined;
    }

    return '(' + where + ')';
  }
}
