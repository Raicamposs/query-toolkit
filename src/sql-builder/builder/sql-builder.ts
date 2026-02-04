import { isEmpty } from '@raicamposs/toolkit';
import { QueryableFields } from '../../types';
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

export interface SqlBuilderConfig {
  maxWhereClauses: number;
  maxOrderByClauses: number;
  maxGroupByClauses: number;
  maxLimit: number;
}
// ... (rest of class) ...



export class SqlBuilder<Table> {
  private where: ReadonlyArray<string> = [];
  private order: ReadonlyArray<string> = [];
  private group: ReadonlyArray<string> = [];
  private limit: number = SQL_BUILDER_CONSTANTS.NO_LIMIT;
  private offset: number = SQL_BUILDER_CONSTANTS.NO_OFFSET;
  private readonly config: SqlBuilderConfig;

  constructor(
    protected sql: string,
    private readonly columnMapper?: Record<string, string>,
    config?: Partial<SqlBuilderConfig>
  ) {
    this.config = {
      maxWhereClauses: config?.maxWhereClauses ?? SQL_BUILDER_CONSTANTS.MAX_WHERE_CLAUSES,
      maxOrderByClauses: config?.maxOrderByClauses ?? SQL_BUILDER_CONSTANTS.MAX_ORDER_BY_CLAUSES,
      maxGroupByClauses: config?.maxGroupByClauses ?? SQL_BUILDER_CONSTANTS.MAX_GROUP_BY_CLAUSES,
      maxLimit: config?.maxLimit ?? SQL_BUILDER_CONSTANTS.MAX_LIMIT,
    };
  }

  /**
   * Static factory method to start building a query from a table.
   * Shortcut for new SqlBuilder(`SELECT * FROM ${table}`)
   */
  static from<T>(table: string, columnMapper?: Record<string, string>, config?: Partial<SqlBuilderConfig>): SqlBuilder<T> {
    return new SqlBuilder<T>(`SELECT * FROM ${table}`, columnMapper, config);
  }

  private column(field: QueryableFields<Table>): string {
    const fieldStr = field.toString();
    if (this.columnMapper && this.columnMapper[fieldStr]) {
      return this.columnMapper[fieldStr];
    }
    return fieldStr;
  }

  /** Filter Elements - Add where clause filters */
  private andFilter(value: Clause) {
    if (this.where.length >= this.config.maxWhereClauses) {
      throw new RangeError(
        `Maximum WHERE clauses exceeded: ${this.config.maxWhereClauses}`
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

  whereIn(field: QueryableFields<Table>, compareFields: string[] | number[]) {
    return this.andFilter(new ClauseIn(this.column(field), compareFields));
  }

  whereLike(field: QueryableFields<Table>, value: string) {
    return this.andFilter(new ClauseLike(this.column(field), value));
  }

  whereILike(field: QueryableFields<Table>, value: string) {
    return this.andFilter(new ClauseILike(this.column(field), value));
  }

  whereBetween(field: QueryableFields<Table>, start: BetweenParam, end: BetweenParam) {
    return this.andFilter(new ClauseBetween(this.column(field), start, end));
  }

  whereGreaterThan(field: QueryableFields<Table>, value: Date | number) {
    return this.andFilter(new ClauseGreaterThan(this.column(field), value));
  }

  whereGreaterThanOrEquals(field: QueryableFields<Table>, value: Date | number) {
    return this.andFilter(new ClauseGreaterThanOrEquals(this.column(field), value));
  }

  whereLessThan(field: QueryableFields<Table>, value: Date | number) {
    return this.andFilter(new ClauseLessThan(this.column(field), value));
  }

  whereLessThanOrEquals(field: QueryableFields<Table>, value: Date | number) {
    return this.andFilter(new ClauseLessThanOrEquals(this.column(field), value));
  }

  whereBetweenOperator(
    field: QueryableFields<Table>,
    operator: {
      gte: Date | number;
      lte: Date | number;
    }
  ) {
    return this.andFilter(new ClauseBetween(this.column(field), operator.gte, operator.lte));
  }

  whereEquals(field: QueryableFields<Table>, value: string | number | boolean) {
    return this.andFilter(new ClauseEquals(this.column(field), value));
  }

  whereNotEquals(field: QueryableFields<Table>, value: string | number | boolean) {
    return this.andFilter(new ClauseNotEquals(this.column(field), value));
  }

  /**
   * Filter by array containment operations
   * @param field - Field name
   * @param compareFields - Array of values to compare
   * @param containment - Containment operator: '@>' (contains) or '<@' (is contained by)
   */
  whereArrayContains(field: QueryableFields<Table>, compareFields: string[], containment?: '<@' | '@>') {
    return this.andFilter(new ClauseContains(this.column(field), compareFields, containment));
  }

  whereConditions(values: Partial<Record<QueryableFields<Table>, Condition>>, transform?: TransformFunction) {
    for (const [key, value] of Object.entries(values)) {
      if (value) {
        this.whereCondition(key as QueryableFields<Table>, value as Condition, transform);
      }
    }
    return this;
  }

  whereCondition(field: QueryableFields<Table>, value: Condition, transform?: TransformFunction) {
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
  addOrder(sort: 'asc' | 'desc', ...value: Array<QueryableFields<Table>>) {
    if (this.order.length + value.length > this.config.maxOrderByClauses) {
      throw new RangeError(
        `Maximum ORDER BY clauses exceeded: ${this.config.maxOrderByClauses}`
      );
    }
    const newOrders = value.map((element) => `${this.column(element)} ${sort}`);
    this.order = [...this.order, ...newOrders];
    return this;
  }

  /** Group by Elements - Add group elements in sequence */
  addGroup(...value: Array<QueryableFields<Table>>) {
    if (this.group.length + value.length > this.config.maxGroupByClauses) {
      throw new RangeError(
        `Maximum GROUP BY clauses exceeded: ${this.config.maxGroupByClauses}`
      );
    }
    const newGroups = value.map((element) => this.column(element));
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
    if (limit > this.config.maxLimit) {
      throw new RangeError(`Limit exceeds maximum: ${this.config.maxLimit}`);
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
    return this.where.join(` ${SQL_KEYWORDS.AND} `);
  }

  build(): string {
    let finalSql = this.sql;

    if (this.where.length > 0) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.WHERE} ${this.where.join(` ${SQL_KEYWORDS.AND} `)}`;
    }

    if (this.group.length > 0) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.GROUP_BY} ${this.group.join(', ')}`;
    }

    if (this.order.length > 0) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.ORDER_BY} ${this.order.join(', ')}`;
    }

    if (this.limit > SQL_BUILDER_CONSTANTS.NO_LIMIT) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.LIMIT} ${this.limit}`;
    }

    if (this.offset > SQL_BUILDER_CONSTANTS.NO_OFFSET) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.OFFSET} ${this.offset}`;
    }

    return finalSql.replace(/\s+/g, ' ').trim();
  }

  /**
   * Creates a deep clone of this SqlBuilder instance
   * Useful for creating derived queries from a base query
   */
  clone(): SqlBuilder<Table> {
    const cloned = new SqlBuilder<Table>(this.sql, this.columnMapper, this.config);
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
