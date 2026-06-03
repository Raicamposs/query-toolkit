import { coalesce, isEmpty, ObjectEntries } from '@raicampos/toolkit';
import { ClassicPage, CursorPage, SortDirection } from '../common';
import {
  CustomValidators,
  FieldCondition,
  FieldTypes,
  FieldValidationDefinition,
  FieldValue,
  ParamsOperators,
  QueryableFields,
  QueryParams,
  QueryShapeSchema,
  RsqlQueryParams,
} from '../common/types';
import { QueryParamsOperator } from '../query-operator';
import { buildPagination } from './internal/pagination-builder';
import { normalizeRsqlBooleanString } from './internal/param-normalizer';
import { validateParams } from './internal/param-validator';
import { buildSort } from './internal/sort-builder';
import { OperatorRegistry } from './operator-registry';

export type {
  CustomValidators,
  FieldCondition,
  FieldTypes,
  FieldValidationDefinition,
  FieldValue,
  ParamsOperators,
  QueryParams,
  QueryShapeSchema,
};

export class QueryParamsParse<T extends object> {
  private readonly validKeys: Map<QueryableFields<T>, FieldTypes>;
  private readonly customValidators: CustomValidators<T>;
  public readonly operators: ParamsOperators<T>;
  public readonly sort?: Record<QueryableFields<T>, SortDirection>;
  public readonly pagination?: ClassicPage | CursorPage;

  constructor(
    private readonly params: RsqlQueryParams<T>,
    private readonly schema?: QueryShapeSchema<T>
  ) {
    this.validKeys = new Map<QueryableFields<T>, FieldTypes>();
    this.customValidators = {};

    if (schema) {
      for (const [key, def] of ObjectEntries(schema)) {
        const fieldKey = key as QueryableFields<T>;
        if (typeof def === 'string') {
          this.validKeys.set(fieldKey, def as FieldTypes);
        } else if (typeof def === 'boolean') {
          if (def) {
            this.validKeys.set(fieldKey, 'string');
          }
        } else if (def && typeof def === 'object') {
          const valDef = def as FieldValidationDefinition<unknown>;
          this.validKeys.set(fieldKey, valDef.type);
          if (valDef.validate) {
            this.customValidators[fieldKey] = valDef.validate;
          }
        }
      }
    }

    this.operators = this.buildParams();
    this.sort = buildSort(this.params, this.validKeys);
    this.pagination = buildPagination(this.params);
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

  public validate(): { success: boolean; errors: string[] };

  public validate(customValidators: CustomValidators<T>): { success: boolean; errors: string[] };

  public validate(
    schema: QueryShapeSchema<T>,
    customValidators?: CustomValidators<T>
  ): { success: boolean; errors: string[] };

  public validate(
    schemaOrValidators?: QueryShapeSchema<T> | CustomValidators<T>,
    customValidators?: CustomValidators<T>
  ): { success: boolean; errors: string[] } {
    if (!schemaOrValidators) {
      return validateParams(this.operators, this.validKeys, this.customValidators);
    }

    const values = Object.values(schemaOrValidators);
    const isCustomValidators = values.some(
      (val) => typeof val === 'function' || Array.isArray(val)
    );

    if (isCustomValidators) {
      return validateParams(
        this.operators,
        this.validKeys,
        schemaOrValidators as CustomValidators<T>
      );
    }

    const keysToValidate = new Map<QueryableFields<T>, FieldTypes>();
    const validatorsToUse: CustomValidators<T> = {};

    for (const [key, def] of ObjectEntries(schemaOrValidators as QueryShapeSchema<T>)) {
      const fieldKey = key as QueryableFields<T>;
      if (typeof def === 'string') {
        keysToValidate.set(fieldKey, def as FieldTypes);
      } else if (typeof def === 'boolean') {
        if (def) {
          keysToValidate.set(fieldKey, 'string');
        }
      } else if (def && typeof def === 'object') {
        const valDef = def as FieldValidationDefinition<unknown>;
        keysToValidate.set(fieldKey, valDef.type);
        if (valDef.validate) {
          validatorsToUse[fieldKey] = valDef.validate;
        }
      }
    }

    if (customValidators) {
      Object.assign(validatorsToUse, customValidators);
    }

    return validateParams(this.operators, keysToValidate, validatorsToUse);
  }

  private buildParams(): ParamsOperators<T> {
    const IGNORED_KEYS = ['sort', 'limit', 'offset', 'page', 'cursor'];
    const output: Record<string, Array<QueryParamsOperator<unknown, unknown>>> = {};

    for (const [key, value] of ObjectEntries(coalesce(this.params, {}))) {
      if (isEmpty(value)) continue;
      if (isEmpty(key)) continue;
      if (IGNORED_KEYS.includes(key)) continue;

      if (this.validKeys.size > 0 && !this.validKeys.has(key as QueryableFields<T>)) continue;

      const expectedType = this.validKeys.get(key as QueryableFields<T>);
      const isBoolean = expectedType === 'boolean';

      const normalizeValue = (val: string): string => {
        if (isBoolean) {
          return normalizeRsqlBooleanString(val);
        }
        return val;
      };

      if (Array.isArray(value)) {
        if (!output[key]) {
          output[key] = [];
        }
        value.forEach((item: string) => {
          output[key].push(OperatorRegistry.resolve(normalizeValue(item)));
        });
      } else {
        output[key] = [OperatorRegistry.resolve(normalizeValue(value as string))];
      }
    }

    return output as ParamsOperators<T>;
  }

  /**
   * Converte os parâmetros RSQL parsados em um objeto com operadores.
   * @returns Objeto com os operadores RSQL.
   */
  asRsqlOperatorsObject() {
    const result: Record<string, unknown> = {};

    for (const [key, operators] of ObjectEntries(this.operators)) {
      const mergedQuery: Record<string, unknown> = {};

      for (const operator of operators as QueryParamsOperator<unknown, unknown>[]) {
        const query = operator.query();
        if (query) {
          Object.assign(mergedQuery, query);
        }
      }

      result[key] = mergedQuery;
    }

    return result;
  }
}
