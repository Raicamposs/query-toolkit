import { isNullOrUndefined } from '@raicampos/toolkit';
import { SortDirection } from '../../../common';
import { QueryableFields } from '../../../common/types';
import { QueryParamsOperator } from '../../../query-operator';
import { QueryParamsConverter } from '../../core/query-params-converter';
import { IQueryParamsConverter } from '../../core/query-params-converter-interface';
import { ISortConverter } from '../../core/sort-converter-interface';
import { PrismaVisitor, PrismaWhereClause, PrismaWhereValue } from '../visitors/prisma-visitor';

export type PrismaOrderByClause = Array<Record<string, SortDirection>>;

export class QueryParamsPrismaConverter<T = unknown>
  implements IQueryParamsConverter<PrismaWhereValue>, ISortConverter<PrismaOrderByClause>
{
  private converter: QueryParamsConverter<T>;
  private visitor: PrismaVisitor;
  constructor(
    private readonly operators: Partial<
      Record<
        QueryableFields<T>,
        QueryParamsOperator<unknown, unknown> | QueryParamsOperator<unknown, unknown>[]
      >
    >
  ) {
    this.converter = new QueryParamsConverter<T>(this.operators);
    this.visitor = new PrismaVisitor();
  }

  sort(sort?: Record<string, SortDirection>): PrismaOrderByClause | undefined {
    if (isNullOrUndefined(sort)) return sort;
    return Object.entries(sort).map(([key, value]) => ({
      [key]: value,
    }));
  }

  build(): Record<string, PrismaWhereValue> {
    const converted = this.converter.to(this.visitor);
    const mergedResult: Record<string, PrismaWhereValue> = {};

    for (const [field, clauses] of Object.entries(converted)) {
      if (clauses.length === 0) continue;

      if (clauses.length === 1) {
        Object.assign(mergedResult, clauses[0]);
        continue;
      }

      this.mergePrismaFieldClauses(mergedResult, field, clauses);
    }

    return mergedResult;
  }

  private mergePrismaFieldClauses(
    target: Record<string, PrismaWhereValue>,
    field: string,
    clauses: PrismaWhereClause[]
  ): void {
    const values = clauses.map((c) => c[field]);
    const isEveryValueObject = values.every(
      (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
    );

    if (isEveryValueObject) {
      target[field] = Object.assign({}, ...values);
      return;
    }

    // eslint-disable-next-line no-console
    console.warn(
      `[query-toolkit] Multiple scalar conditions for field "${field}": only the last will apply. ` +
        `Consider using "in=" for multi-value equality.`
    );
    target[field] = values[values.length - 1];
  }
}
