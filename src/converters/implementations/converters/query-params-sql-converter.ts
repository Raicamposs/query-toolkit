import type { SortDirection } from '../../../common';
import type { QueryableFields } from '../../../common/types';
import type { QueryParamsOperator } from '../../../query-operator';
import type { Clause } from '../../../sql-builder';
import { QueryParamsConverter } from '../../core/query-params-converter';
import type { IQueryParamsConverter } from '../../core/query-params-converter-interface';
import type { ISortConverter } from '../../core/sort-converter-interface';
import { ClauseVisitor } from '../visitors/clause-visitor';

export type SqlOrderByClause = Record<string, SortDirection>;

export class QueryParamsSqlConverter<T = unknown>
  implements IQueryParamsConverter<Clause[]>, ISortConverter<SqlOrderByClause>
{
  private converter: QueryParamsConverter<T>;
  private visitor: ClauseVisitor;
  constructor(
    private readonly operators: Partial<
      Record<
        QueryableFields<T>,
        QueryParamsOperator<unknown, unknown> | QueryParamsOperator<unknown, unknown>[]
      >
    >
  ) {
    this.converter = new QueryParamsConverter<T>(this.operators);
    this.visitor = new ClauseVisitor();
  }

  sort(sort?: Record<string, SortDirection>): SqlOrderByClause | undefined {
    return sort;
  }

  build(): Record<string, Clause[]> {
    return this.converter.to(this.visitor);
  }
}
