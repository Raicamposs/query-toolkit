import { isEmpty } from '@raicamposs/toolkit';

import { Clause } from '../core/clause';
import { SQL_BUILDER_CONSTANTS } from '../core/constants';
import { SQL_KEYWORDS } from '../core/sql-keywords';
import { TransformFunction } from '../core/transform-function';
import {
  BetweenParam,
  ClauseBetween,
  ClauseCondition,
  ClauseContains,
  ClauseEquals,
  ClauseGreaterThan,
  ClauseGreaterThanOrEquals,
  ClauseILike,
  ClauseIn,
  ClauseLessThan,
  ClauseLessThanOrEquals,
  ClauseLike,
  ClauseNotEquals,
  ClauseNotExists,
  ClauseOr,
  Condition,
} from '../implementations';
import { ClauseExists } from '../implementations/clause-exists';

export class SqlBuilder<Table> {
  private where: ReadonlyArray<string> = [];
  private order: ReadonlyArray<string> = [];
  private group: ReadonlyArray<string> = [];
  private limit: number = SQL_BUILDER_CONSTANTS.NO_LIMIT;
  private offset: number = SQL_BUILDER_CONSTANTS.NO_OFFSET;

  constructor(protected sql: string) {}

  /** Filter Elements - Add where clause filters */
  private andFilter(value: Clause) {
    if (this.where.length >= SQL_BUILDER_CONSTANTS.MAX_WHERE_CLAUSES) {
      throw new RangeError(
        `Maximum WHERE clauses exceeded: ${SQL_BUILDER_CONSTANTS.MAX_WHERE_CLAUSES}`
      );
    }
    const filter = value.build();
    if (filter) this.where = [...this.where, `(${filter})`];
    return this;
  }

  whereClause(clause: Clause) {
    return this.andFilter(clause);
  }

  whereExists(sql: string) {
    return this.andFilter(new ClauseExists(sql));
  }

  whereNotExists(sql: string) {
    return this.andFilter(new ClauseNotExists(sql));
  }

  whereIn(field: keyof Table, compareFields: string[] | number[]) {
    return this.andFilter(new ClauseIn(field.toString(), compareFields));
  }

  whereLike(field: keyof Table, value: string) {
    return this.andFilter(new ClauseLike(field.toString(), value));
  }

  whereILike(field: keyof Table, value: string) {
    return this.andFilter(new ClauseILike(field.toString(), value));
  }

  whereBetween(field: keyof Table, start: BetweenParam, end: BetweenParam) {
    return this.andFilter(new ClauseBetween(field.toString(), start, end));
  }

  whereGreaterThan(field: keyof Table, value: Date | number) {
    return this.andFilter(new ClauseGreaterThan(field.toString(), value));
  }

  whereGreaterThanOrEquals(field: keyof Table, value: Date | number) {
    return this.andFilter(new ClauseGreaterThanOrEquals(field.toString(), value));
  }

  whereLessThan(field: keyof Table, value: Date | number) {
    return this.andFilter(new ClauseLessThan(field.toString(), value));
  }

  whereLessThanOrEquals(field: keyof Table, value: Date | number) {
    return this.andFilter(new ClauseLessThanOrEquals(field.toString(), value));
  }

  whereBetweenOperator(
    field: keyof Table,
    operator: {
      gte: Date | number;
      lte: Date | number;
    }
  ) {
    return this.andFilter(new ClauseBetween(field.toString(), operator.gte, operator.lte));
  }

  whereEquals(field: keyof Table, value: string | number | boolean) {
    return this.andFilter(new ClauseEquals(field.toString(), value));
  }

  whereNotEquals(field: keyof Table, value: string | number | boolean) {
    return this.andFilter(new ClauseNotEquals(field.toString(), value));
  }

  /**
   * Filter by array containment operations
   * @param field - Field name
   * @param compareFields - Array of values to compare
   * @param containment - Containment operator: '@>' (contains) or '<@' (is contained by)
   */
  whereArrayContains(field: keyof Table, compareFields: string[], containment?: '<@' | '@>') {
    return this.andFilter(new ClauseContains(field.toString(), compareFields, containment));
  }

  whereConditions(values: Record<keyof Table, Condition>, transform?: TransformFunction) {
    for (const [key, value] of Object.entries(values)) {
      this.whereCondition(key as keyof Table, value as Condition, transform);
    }
    return this;
  }

  whereCondition(field: keyof Table, value: Condition, transform?: TransformFunction) {
    return this.andFilter(new ClauseCondition(field.toString(), value, transform));
  }

  whereRaw(raw: string) {
    if (!isEmpty(raw)) this.where = [...this.where, raw];
    return this;
  }

  orFilter(...value: Clause[]) {
    return this.andFilter(new ClauseOr(...value));
  }

  /** Order by Elements - Add sorting elements in sequence */
  addOrder(sort: 'asc' | 'desc', ...value: Array<keyof Table>) {
    if (this.order.length + value.length > SQL_BUILDER_CONSTANTS.MAX_ORDER_BY_CLAUSES) {
      throw new RangeError(
        `Maximum ORDER BY clauses exceeded: ${SQL_BUILDER_CONSTANTS.MAX_ORDER_BY_CLAUSES}`
      );
    }
    const newOrders = value.map((element) => `${element.toString()} ${sort}`);
    this.order = [...this.order, ...newOrders];
    return this;
  }

  /** Group by Elements - Add group elements in sequence */
  addGroup(...value: Array<keyof Table>) {
    if (this.group.length + value.length > SQL_BUILDER_CONSTANTS.MAX_GROUP_BY_CLAUSES) {
      throw new RangeError(
        `Maximum GROUP BY clauses exceeded: ${SQL_BUILDER_CONSTANTS.MAX_GROUP_BY_CLAUSES}`
      );
    }
    const newGroups = value.map((element) => element.toString());
    this.group = [...this.group, ...newGroups];
    return this;
  }

  addLimit(limit: number) {
    if (!Number.isInteger(limit)) {
      throw new TypeError('Limit must be an integer');
    }
    if (limit < 0) {
      throw new RangeError('Limit must be non-negative');
    }
    if (limit > SQL_BUILDER_CONSTANTS.MAX_LIMIT) {
      throw new RangeError(`Limit exceeds maximum: ${SQL_BUILDER_CONSTANTS.MAX_LIMIT}`);
    }
    this.limit = limit;
    return this;
  }

  addOffset(offset: number) {
    if (!Number.isInteger(offset)) {
      throw new TypeError('Offset must be an integer');
    }
    if (offset < 0) {
      throw new RangeError('Offset must be non-negative');
    }
    this.offset = offset;
    return this;
  }

  buildWhere() {
    return this.where.join(` ${SQL_KEYWORDS.AND.toLowerCase()} `);
  }

  build(): string {
    let finalSql = this.sql;

    if (this.where.length > 0) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.WHERE.toLowerCase()} ${this.where.join(` ${SQL_KEYWORDS.AND.toLowerCase()} `)}`;
    }

    if (this.group.length > 0) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.GROUP_BY.toLowerCase()} ${this.group.join(', ')}`;
    }

    if (this.order.length > 0) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.ORDER_BY.toLowerCase()} ${this.order.join(', ')}`;
    }

    if (this.limit > SQL_BUILDER_CONSTANTS.NO_LIMIT) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.LIMIT.toLowerCase()} ${this.limit}`;
    }

    if (this.offset > SQL_BUILDER_CONSTANTS.NO_OFFSET) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.OFFSET.toLowerCase()} ${this.offset}`;
    }
    return finalSql.replace(/\s+/g, ' ').trim();
  }

  /**
   * Creates a deep clone of this SqlBuilder instance
   * Useful for creating derived queries from a base query
   */
  clone(): SqlBuilder<Table> {
    const cloned = new SqlBuilder<Table>(this.sql);
    cloned.where = [...this.where];
    cloned.order = [...this.order];
    cloned.group = [...this.group];
    cloned.limit = this.limit;
    cloned.offset = this.offset;
    return cloned;
  }

  /**
   * Returns a human-readable string representation for debugging
   */
  toString(): string {
    return `SqlBuilder {
  base: "${this.sql}",
  where: [${this.where.map((w) => `"${w}"`).join(', ')}],
  order: [${this.order.map((o) => `"${o}"`).join(', ')}],
  group: [${this.group.map((g) => `"${g}"`).join(', ')}],
  limit: ${this.limit},
  offset: ${this.offset}
}`;
  }

  /**
   * Returns a JSON representation of the builder state
   */
  toJSON() {
    return {
      base: this.sql,
      where: [...this.where],
      order: [...this.order],
      group: [...this.group],
      limit: this.limit,
      offset: this.offset,
      sql: this.build(),
    };
  }
}
