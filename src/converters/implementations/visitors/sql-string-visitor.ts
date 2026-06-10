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
import type { PrimitiveValueType } from '../../../common/types/primitive-value';
import { SqlPrimitiveValue } from '../../../sql-builder/core/sql-primitive-value';
import { BaseOperatorVisitor } from '../../core/base-operator-visitor';

/**
 * Visitor que converte operadores RSQL em fragmentos de condição SQL como strings.
 *
 * Os valores são escapados via SqlPrimitiveValue, mantendo proteção contra SQL Injection.
 * Use QueryParamsSqlStringConverter para obter a cláusula WHERE completa.
 *
 * @example
 * const visitor = new SqlStringVisitor();
 * const cond = new EqualsOperator('==ACTIVE').accept(visitor, 'status');
 * // "status = 'ACTIVE'"
 */
export class SqlStringVisitor extends BaseOperatorVisitor<string> {
  private toSql(value: PrimitiveValueType | null | undefined): string {
    return new SqlPrimitiveValue(value ?? null).toSql() ?? 'NULL';
  }

  private toArraySql(values: PrimitiveValueType[]): string {
    return values.map((v) => this.toSql(v)).join(', ');
  }

  visitEquals(operator: EqualsOperator, field: string): string {
    return `${field} = ${this.toSql(operator.value())}`;
  }

  visitNotEquals(operator: NotEqualsOperator, field: string): string {
    return `${field} != ${this.toSql(operator.value())}`;
  }

  visitIn(operator: InOperator, field: string): string {
    return `${field} IN (${this.toArraySql(operator.value())})`;
  }

  visitNotIn(operator: NotInOperator, field: string): string {
    return `${field} NOT IN (${this.toArraySql(operator.value())})`;
  }

  visitGreaterThan(operator: GreaterThanOperator, field: string): string {
    return `${field} > ${this.toSql(operator.value())}`;
  }

  visitGreaterThanOrEquals(operator: GreaterThanOrEqualsOperator, field: string): string {
    return `${field} >= ${this.toSql(operator.value())}`;
  }

  visitLessThan(operator: LessThanOperator, field: string): string {
    return `${field} < ${this.toSql(operator.value())}`;
  }

  visitLessThanOrEquals(operator: LessThanOrEqualsOperator, field: string): string {
    return `${field} <= ${this.toSql(operator.value())}`;
  }

  visitContains(operator: ContainsOperator, field: string): string {
    const value = operator.value();
    return `${field} ILIKE ${new SqlPrimitiveValue(`%${value}%`).toSql()}`;
  }

  visitNotContains(operator: NotContainsOperator, field: string): string {
    const value = operator.value();
    return `${field} NOT ILIKE ${new SqlPrimitiveValue(`%${value}%`).toSql()}`;
  }

  visitBetween(operator: BetweenOperator, field: string): string {
    const value = operator.value();
    if (!value) {
      throw new Error(`Valor inválido para operador Between no campo "${field}".`);
    }
    return `${field} BETWEEN ${this.toSql(value.gte)} AND ${this.toSql(value.lte)}`;
  }

  visitArrayContains(operator: ArrayContainsOperator, field: string): string {
    const values = Array.isArray(operator.value()) ? operator.value() : [operator.value()];
    return `${field} @> ARRAY[${this.toArraySql(values as PrimitiveValueType[])}]`;
  }

  visitArrayIsContainedBy(operator: ArrayIsContainedByOperator, field: string): string {
    const values = Array.isArray(operator.value()) ? operator.value() : [operator.value()];
    return `${field} <@ ARRAY[${this.toArraySql(values as PrimitiveValueType[])}]`;
  }

  visitArrayOverlap(operator: ArrayOverlapOperator, field: string): string {
    const values = Array.isArray(operator.value()) ? operator.value() : [operator.value()];
    return `${field} && ARRAY[${this.toArraySql(values as PrimitiveValueType[])}]`;
  }

  visitUnknown(operator: UnknownOperator, field: string): string {
    const value = operator.value();
    if (isNullOrUndefined(value)) return '';
    return `${field} = ${this.toSql(value)}`;
  }
}
