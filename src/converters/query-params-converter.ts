import { QueryParamsOperator } from '../query-operator';
import type { Clause } from '../sql-builder/core/clause';
import { QueryableFields } from '../types';
import { ClauseVisitor } from './clause-visitor';
import { OperatorVisitor } from './operator-visitor';
import { PrismaVisitor } from './prisma-visitor';

/**
 * Helper class to convert multiple QueryParamsOperator instances to different formats
 */
export class QueryParamsConverter<T = any> {
  constructor(
    private readonly operators: Partial<
      Record<QueryableFields<T>, QueryParamsOperator | QueryParamsOperator[]>
    >
  ) { }

  /**
   * Converts operators using the provided visitor
   */
  to<T>(visitor: OperatorVisitor<T>): Record<string, T[]> {
    const result: Record<string, T[]> = {};

    for (const [field, data] of Object.entries(this.operators)) {
      const ops = Array.isArray(data) ? data : [data];
      result[field] = ops.map((op) => op.accept(visitor, field));
    }

    return result;
  }

  /**
   * Converts operators to Prisma where clause format
   */
  toPrisma(): Record<string, any> {
    const visitor = new PrismaVisitor();
    const converted = this.to(visitor);
    const result: Record<string, any> = {};

    for (const [field, clauses] of Object.entries(converted)) {
      if (clauses.length === 0) continue;

      // Merge multiple clauses for the same field
      if (clauses.length === 1) {
        Object.assign(result, clauses[0]);
      } else {
        // Find the specific field value to merge
        const values = clauses.map((c) => c[field]);
        const allObjects = values.every((v) => typeof v === 'object' && v !== null && !Array.isArray(v));

        if (allObjects) {
          result[field] = Object.assign({}, ...values);
        } else {
          // If not all are objects, last one wins (simple override)
          result[field] = values[values.length - 1];
        }
      }
    }

    return result;
  }

  /**
   * Converts operators to a map of SQL clauses
   */
  toClauses(): Record<string, Clause[]> {
    return this.to(new ClauseVisitor());
  }

  /**
   * Converts operators to a flattened array of SQL clauses
   */
  toClausesArray(): Clause[] {
    return Object.values(this.toClauses()).flat();
  }
}
