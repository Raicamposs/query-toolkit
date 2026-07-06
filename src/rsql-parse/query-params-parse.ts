import { coalesce, isEmpty, ObjectEntries } from '@raicampos/toolkit';
import type { SortDirection } from '../common';
import { ClassicPage, CursorPage, SortParser } from '../common';
import type {
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
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
} from '../common/types';
import type { QueryParamsOperator } from '../query-operator';
import { buildPagination } from './internal/pagination-builder';
import { normalizePlainBoolean, normalizeRsqlBooleanString } from './internal/param-normalizer';
import { validateParams } from './internal/param-validator';
import { buildSort } from './internal/sort-builder';
import { OperatorRegistry } from './operator-registry';
import { ValidationException } from './validation-exception';

function parseSchema<T extends object>(
  schema: QueryShapeSchema<T>
): {
  keys: Map<QueryableFields<T>, FieldTypes>;
  validators: CustomValidators<T>;
} {
  const keys = new Map<QueryableFields<T>, FieldTypes>();
  const validators: CustomValidators<T> = {};

  for (const [key, def] of ObjectEntries(schema)) {
    const fieldKey = key as QueryableFields<T>;
    if (typeof def === 'string') {
      keys.set(fieldKey, def as FieldTypes);
    } else if (def === true) {
      keys.set(fieldKey, 'string');
    } else if (def && typeof def === 'object') {
      const valDef = def as FieldValidationDefinition<unknown>;
      keys.set(fieldKey, valDef.type);
      if (valDef.validate) {
        validators[fieldKey] = valDef.validate;
      }
    }
  }

  return { keys, validators };
}

function isCustomValidatorsObject<T extends object>(
  obj: QueryShapeSchema<T> | CustomValidators<T>
): obj is CustomValidators<T> {
  return Object.values(obj).every(
    (val) =>
      typeof val === 'function' || (Array.isArray(val) && val.every((v) => typeof v === 'function'))
  );
}

export { ValidationException };
export type {
  CustomValidators,
  FieldCondition,
  FieldTypes,
  FieldValidationDefinition,
  FieldValue,
  ParamsOperators,
  QueryParams,
  QueryShapeSchema,
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
};

const PAGINATION_KEYS = new Set(['sort', 'limit', 'offset', 'page', 'cursor']);

export class QueryParamsParse<T extends object> {
  private readonly validKeys: Map<QueryableFields<T>, FieldTypes>;
  private readonly customValidators: CustomValidators<T>;
  private readonly rawSortFields: string[];
  public readonly operators: ParamsOperators<T>;
  public readonly sort?: Record<QueryableFields<T>, SortDirection>;
  public readonly pagination?: ClassicPage | CursorPage;

  constructor(
    private readonly params: RsqlQueryParams<T>,
    schema?: QueryShapeSchema<T>
  ) {
    this.validKeys = new Map<QueryableFields<T>, FieldTypes>();
    this.customValidators = {};

    if (schema) {
      const { keys, validators } = parseSchema(schema);
      this.validKeys = keys;
      this.customValidators = validators;
    }

    this.operators = this.buildParams();
    this.sort = buildSort(this.params, this.validKeys);

    // Armazena todos os campos de sort informados (antes do filtro por schema)
    // para detectar campos inválidos na validação
    const rawSortParam = (this.params as Record<string, unknown>).sort;
    this.rawSortFields =
      typeof rawSortParam === 'string' ? Object.keys(SortParser.parse(rawSortParam)) : [];
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

  public validate(): ValidationResult;
  public validate(customValidators: CustomValidators<T>): ValidationResult;
  public validate(
    schema: QueryShapeSchema<T>,
    customValidators?: CustomValidators<T>
  ): ValidationResult;
  public validate(
    schemaOrValidators?: QueryShapeSchema<T> | CustomValidators<T>,
    customValidators?: CustomValidators<T>
  ): ValidationResult {
    return this.executeValidation(schemaOrValidators, customValidators);
  }

  /**
   * Executa a validação e lança `ValidationException` se houver erros.
   * Ideal para o padrão "falha rápida" onde dados inválidos são uma exceção não recuperável.
   *
   * @throws {ValidationException} com a lista completa de erros estruturados
   *
   * @example
   * try {
   *   parser.validateOrThrow({ age: 'number' });
   * } catch (e) {
   *   if (e instanceof ValidationException) {
   *     e.errors.forEach(err => res.addError(err.field, err.message));
   *   }
   * }
   */
  public validateOrThrow(): void;
  public validateOrThrow(customValidators: CustomValidators<T>): void;
  public validateOrThrow(schema: QueryShapeSchema<T>, customValidators?: CustomValidators<T>): void;
  public validateOrThrow(
    schemaOrValidators?: QueryShapeSchema<T> | CustomValidators<T>,
    customValidators?: CustomValidators<T>
  ): void {
    const result = this.executeValidation(schemaOrValidators, customValidators);
    if (!result.success) throw new ValidationException(result.errors);
  }

  private executeValidation(
    schemaOrValidators?: QueryShapeSchema<T> | CustomValidators<T>,
    customValidators?: CustomValidators<T>
  ): ValidationResult {
    let keys: Map<QueryableFields<T>, FieldTypes>;
    let validators: CustomValidators<T>;

    if (!schemaOrValidators) {
      keys = this.validKeys;
      validators = this.customValidators;
    } else if (isCustomValidatorsObject<T>(schemaOrValidators)) {
      keys = this.validKeys;
      validators = schemaOrValidators;
    } else {
      const parsed = parseSchema(schemaOrValidators);
      keys = parsed.keys;
      validators = customValidators
        ? { ...parsed.validators, ...customValidators }
        : parsed.validators;
    }

    const { errors } = validateParams(this.operators, keys, validators);

    // Validação de sort — apenas quando schema está presente
    if (keys.size > 0 && this.rawSortFields.length > 0) {
      for (const field of this.rawSortFields) {
        if (!keys.has(field as QueryableFields<T>)) {
          errors.push({
            field,
            message: `ordenação pelo campo '${field}' não é permitida`,
            code: 'INVALID_SORT_FIELD',
          });
        }
      }
    }

    return { success: errors.length === 0, errors };
  }

  private buildParams(): ParamsOperators<T> {
    const output: Record<string, Array<QueryParamsOperator<unknown, unknown>>> = {};

    for (const [key, value] of ObjectEntries(coalesce(this.params, {}))) {
      if (isEmpty(value)) continue;
      if (isEmpty(key)) continue;
      if (PAGINATION_KEYS.has(key)) continue;

      if (this.validKeys.size > 0 && !this.validKeys.has(key as QueryableFields<T>)) continue;

      const expectedType = this.validKeys.get(key as QueryableFields<T>);
      const isBoolean = expectedType === 'boolean';

      const normalizeValue = (val: string): string => {
        if (!isBoolean) return val;
        const normalized = normalizeRsqlBooleanString(val);
        return normalized !== val ? normalized : normalizePlainBoolean(val);
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
