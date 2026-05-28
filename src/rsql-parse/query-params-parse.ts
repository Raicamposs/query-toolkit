import { coalesce, isEmpty, ObjectEntries } from '@raicamposs/toolkit';
import { ClassicPage, CursorPage, SortDirection, SortParser } from '../common';
import { QueryableFields, RsqlQueryParams } from '../common/types';
import { QueryParamsOperator } from '../query-operator';
import { OperatorRegistry } from './operator-registry';

export type ParamsOperators<T extends object> = Record<
  Exclude<QueryableFields<T>, 'sort' | 'limit' | 'offset' | 'page' | 'cursor'>,
  Array<QueryParamsOperator<unknown, unknown>>
>;

export type QueryParams<T extends object> = {
  params: ParamsOperators<T>;
  sort?: Record<QueryableFields<T>, SortDirection>;
  pagination?: ClassicPage | CursorPage;
};

export type FieldTypes = 'string' | 'number' | 'boolean' | 'date';

export class QueryParamsParse<T extends object> {
  private readonly validKeys: Map<QueryableFields<T>, FieldTypes>;
  public readonly operators: ParamsOperators<T>;
  public readonly sort?: Record<QueryableFields<T>, SortDirection>;
  public readonly pagination?: ClassicPage | CursorPage;

  constructor(
    private readonly params: RsqlQueryParams<T>,
    private readonly shape?: Partial<Record<QueryableFields<T>, FieldTypes>>
  ) {
    this.validKeys = new Map(
      shape ? (Object.entries(shape) as [QueryableFields<T>, FieldTypes][]) : []
    );
    this.operators = this.buildParams();
    this.sort = this.buildSort();
    this.pagination = this.buildPagination();
  }

  get isClassicPage(): boolean {
    return this.pagination instanceof ClassicPage;
  }

  get isCursorPage(): boolean {
    return this.pagination instanceof CursorPage;
  }

  get hasPagination(): boolean {
    return !!this.pagination;
  }

  get hasSort(): boolean {
    return !!this.sort;
  }

  get hasOperators(): boolean {
    return ObjectEntries(this.operators).length > 0;
  }

  paginationAsClassicPage(defaultPage?: ClassicPage): ClassicPage | undefined {
    return this.isClassicPage ? (this.pagination as ClassicPage) : defaultPage;
  }

  paginationAsCursorPage(defaultPage?: CursorPage): CursorPage | undefined {
    return this.isCursorPage ? (this.pagination as CursorPage) : defaultPage;
  }

  public validate(): { success: boolean; errors: string[] } {
    const validationErrors: string[] = [];
    for (const [field, operators] of ObjectEntries(this.operators)) {
      for (const operator of operators as Array<QueryParamsOperator<unknown, unknown>>) {
        const parseResult = operator.safeParse();

        if (!parseResult.success) {
          validationErrors.push(`Field '${field}': ${parseResult.error}`);
          continue;
        }

        const expectedType = this.validKeys.get(field as QueryableFields<T>);

        if (expectedType) {
          const value = operator.value();
          const baseType = expectedType.replace('[]', '');

          const checkType = (v: unknown) => {
            if (baseType === 'date') return v instanceof Date;
            return typeof v === baseType;
          };

          const isInvalid = Array.isArray(value)
            ? value.some((v) => !checkType(v))
            : !checkType(value);

          if (isInvalid) {
            validationErrors.push(`Field '${field}': expected type '${expectedType}'.`);
          }
        }
      }
    }

    return {
      success: validationErrors.length === 0,
      errors: validationErrors,
    };
  }

  private buildSort(): Record<QueryableFields<T>, SortDirection> | undefined {
    if ('sort' in this.params) {
      if (typeof this.params.sort !== 'string') {
        return undefined;
      }

      const sort = SortParser.parse(this.params.sort);

      return ObjectEntries(sort).reduce(
        (acc, [key, value]) => {
          if (this.validKeys.size === 0 || this.validKeys.has(key as QueryableFields<T>)) {
            acc[key as QueryableFields<T>] = value;
          }
          return acc;
        },
        {} as Record<QueryableFields<T>, SortDirection>
      );
    }

    return undefined;
  }

  private buildPagination(): ClassicPage | CursorPage | undefined {
    if ('limit' in this.params && 'page' in this.params) {
      const limit = Number(this.params.limit);
      const page = Number(this.params.page);
      if (Number.isNaN(limit) || Number.isNaN(page)) {
        return undefined;
      }
      return new ClassicPage(limit, page);
    }

    if ('limit' in this.params && 'offset' in this.params) {
      const limit = Number(this.params.limit);
      const offset = Number(this.params.offset);
      if (Number.isNaN(limit) || Number.isNaN(offset)) {
        return undefined;
      }
      return ClassicPage.fromOffset(offset, limit);
    }

    if ('limit' in this.params || 'cursor' in this.params) {
      const limit = 'limit' in this.params ? Number(this.params.limit) : 20;
      const cursor = 'cursor' in this.params ? (this.params.cursor as string) : undefined;
      if (Number.isNaN(limit)) {
        return undefined;
      }
      return new CursorPage(limit, cursor);
    }

    return undefined;
  }

  private buildParams(): ParamsOperators<T> {
    const IGNORED_KEYS = ['sort', 'limit', 'offset', 'page', 'cursor'];
    const output: Record<string, Array<QueryParamsOperator<unknown, unknown>>> = {};
    ObjectEntries(coalesce(this.params, {})).reduce((acc, [key, value]) => {
      if (isEmpty(value)) return acc;
      if (isEmpty(key)) return acc;
      if (IGNORED_KEYS.includes(key as string)) return acc;

      if (this.validKeys.size > 0 && !this.validKeys.has(key as QueryableFields<T>)) return acc;

      if (Array.isArray(value)) {
        if (!acc[key]) {
          acc[key] = [];
        }
        value.forEach((item: string) => {
          acc[key].push(OperatorRegistry.resolve(item));
        });
        return acc;
      }
      acc[key] = [OperatorRegistry.resolve(value as string)];
      return acc;
    }, output);

    return output as Record<QueryableFields<T>, Array<QueryParamsOperator<unknown, unknown>>>;
  }

  /**
   * Converte os parâmetros RSQL parsados em um objeto com operadores.
   * @returns Objeto com os operadores RSQL.
   */
  asRsqlOperatorsObject() {
    const queryParams: Record<
      string,
      Array<QueryParamsOperator<unknown, unknown>>
    > = this.buildParams();
    return ObjectEntries(queryParams)
      .map(([key, value]) => {
        const query = value
          .map((v) => v.query())
          .reduce(
            (acc: Record<string, unknown>, curr) => {
              if (curr) {
                const currentObj = curr as Record<string, unknown>;
                for (const k in currentObj) {
                  if (Object.prototype.hasOwnProperty.call(currentObj, k)) {
                    acc[k] = currentObj[k];
                  }
                }
              }
              return acc;
            },
            {} as Record<string, unknown>
          );
        return { [key]: query };
      })
      .reduce(
        (acc: Record<string, unknown>, curr) => {
          const currentObj = curr as Record<string, unknown>;
          for (const k in currentObj) {
            if (Object.prototype.hasOwnProperty.call(currentObj, k)) {
              acc[k] = currentObj[k];
            }
          }
          return acc;
        },
        {} as Record<string, unknown>
      );
  }
}
