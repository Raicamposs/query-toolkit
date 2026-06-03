import { isNullOrUndefined } from '@raicampos/toolkit';
import type { ArrayContainsOperator } from '../../../query-operator/operators/array-contains-operator';
import type { ArrayIsContainedByOperator } from '../../../query-operator/operators/array-is-contained-by-operator';
import type { ArrayOverlapOperator } from '../../../query-operator/operators/array-overlap-operator';
import type { BetweenOperator } from '../../../query-operator/operators/between-operator';
import type { ContainsOperator } from '../../../query-operator/operators/contains-operator';
import type { EqualsOperator } from '../../../query-operator/operators/equals-operator';
import type { GreaterThanOperator } from '../../../query-operator/operators/greater-than-operator';
import type { GreaterThanOrEqualsOperator } from '../../../query-operator/operators/greater-than-or-equals-operator';
import type { InOperator } from '../../../query-operator/operators/in-operator';
import type { LessThanOperator } from '../../../query-operator/operators/less-than-operator';
import type { LessThanOrEqualsOperator } from '../../../query-operator/operators/less-than-or-equals-operator';
import type { NotContainsOperator } from '../../../query-operator/operators/not-contains-operator';
import type { NotEqualsOperator } from '../../../query-operator/operators/not-equals-operator';
import type { NotInOperator } from '../../../query-operator/operators/not-in-operator';
import type { UnknownOperator } from '../../../query-operator/operators/unknown-operator';
import { Clause } from '../../../sql-builder/core/clause';
import {
  ClauseArrayContains,
  ClauseArrayIsContainedBy,
  ClauseArrayOverlap,
  ClauseBetween,
  ClauseEmpty,
  ClauseEquals,
  ClauseGreaterThan,
  ClauseGreaterThanOrEquals,
  ClauseILike,
  ClauseIn,
  ClauseLessThan,
  ClauseLessThanOrEquals,
  ClauseNotEquals,
  ClauseNotILike,
  ClauseNotIn,
} from '../../../sql-builder/implementations';
import { BaseOperatorVisitor } from '../../core/base-operator-visitor';

/**
 * Visitor implementation that converts QueryParamsOperator to SQL Clause objects
 */
export class ClauseVisitor extends BaseOperatorVisitor<Clause> {
  private assertValue(value: unknown, field: string, operatorName: string): asserts value {
    if (isNullOrUndefined(value))
      throw new Error(`Field "${field}": value is required for ${operatorName} operator.`);
  }

  visitEquals(operator: EqualsOperator, field: string): Clause {
    const value = operator.value();
    this.assertValue(value, field, 'Equals');
    return new ClauseEquals(field, value);
  }

  visitNotEquals(operator: NotEqualsOperator, field: string): Clause {
    const value = operator.value();
    this.assertValue(value, field, 'NotEquals');
    return new ClauseNotEquals(field, value);
  }

  visitIn(operator: InOperator, field: string): Clause {
    const value = operator.value();
    return new ClauseIn(field, Array.isArray(value) ? value : [value]);
  }

  visitNotIn(operator: NotInOperator, field: string): Clause {
    const value = operator.value();
    const values = Array.isArray(value) ? value : [value];
    return new ClauseNotIn(field, values);
  }

  visitGreaterThan(operator: GreaterThanOperator, field: string): Clause {
    const value = operator.value();
    this.assertValue(value, field, 'GreaterThan');
    return new ClauseGreaterThan(field, value);
  }

  visitGreaterThanOrEquals(operator: GreaterThanOrEqualsOperator, field: string): Clause {
    const value = operator.value();
    this.assertValue(value, field, 'GreaterThanOrEquals');
    return new ClauseGreaterThanOrEquals(field, value);
  }

  visitLessThan(operator: LessThanOperator, field: string): Clause {
    const value = operator.value();
    this.assertValue(value, field, 'LessThan');
    return new ClauseLessThan(field, value);
  }

  visitLessThanOrEquals(operator: LessThanOrEqualsOperator, field: string): Clause {
    const value = operator.value();
    this.assertValue(value, field, 'LessThanOrEquals');
    return new ClauseLessThanOrEquals(field, value);
  }

  visitContains(operator: ContainsOperator, field: string): Clause {
    const value = operator.value();
    this.assertValue(value, field, 'Contains');
    return new ClauseILike(field, `%${value}%`);
  }

  visitNotContains(operator: NotContainsOperator, field: string): Clause {
    const value = operator.value();
    this.assertValue(value, field, 'NotContains');
    return new ClauseNotILike(field, `%${value}%`);
  }

  visitBetween(operator: BetweenOperator, field: string): Clause {
    const value = operator.value();

    if (isNullOrUndefined(value)) {
      throw new Error(`Invalid value for Between operator on field "${field}".`);
    }

    return new ClauseBetween(field, value.gte, value.lte);
  }

  visitArrayContains(operator: ArrayContainsOperator, field: string): Clause {
    const value = operator.value();
    const values = Array.isArray(value) ? value : [value];
    return new ClauseArrayContains(field, values);
  }

  visitArrayIsContainedBy(operator: ArrayIsContainedByOperator, field: string): Clause {
    const value = operator.value();
    const values = Array.isArray(value) ? value : [value];
    return new ClauseArrayIsContainedBy(field, values);
  }

  visitArrayOverlap(operator: ArrayOverlapOperator, field: string): Clause {
    const value = operator.value();
    const values = Array.isArray(value) ? value : [value];
    return new ClauseArrayOverlap(field, values);
  }

  visitUnknown(operator: UnknownOperator, field: string): Clause {
    const value = operator.value();

    if (isNullOrUndefined(value)) {
      return new ClauseEmpty();
    }

    return new ClauseEquals(field, value);
  }
}
