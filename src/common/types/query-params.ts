import type { ClassicPage, CursorPage, SortDirection } from '../pagination';
import type { QueryableFields } from './entity-fields';
import type {
  ArrayCondition,
  BooleanCondition,
  NumberCondition,
  StringCondition,
} from './rsql-condition';
import type { QueryParamsOperator } from '../../query-operator/query-params-operator';

export type FieldCondition<Val> = Val extends number
  ? NumberCondition
  : Val extends boolean
    ? BooleanCondition
    : Val extends unknown[]
      ? ArrayCondition
      : Val extends Date
        ? StringCondition
        : Val extends string
          ? StringCondition
          : unknown;

export type FieldValue<Val> = Val extends number
  ? number
  : Val extends boolean
    ? boolean
    : Val extends unknown[]
      ? string[]
      : Val extends Date
        ? string
        : Val extends string
          ? string
          : unknown;

export type ParamsOperators<T extends object> = {
  [K in Exclude<QueryableFields<T>, 'sort' | 'limit' | 'offset' | 'page' | 'cursor'>]: Array<
    QueryParamsOperator<FieldCondition<T[K]>, FieldValue<T[K]>>
  >;
};

export type QueryParams<T extends object> = {
  params: ParamsOperators<T>;
  sort?: Record<QueryableFields<T>, SortDirection>;
  pagination?: ClassicPage | CursorPage;
};

export type FieldTypes =
  'string' | 'number' | 'boolean' | 'date' | 'string[]' | 'number[]' | 'boolean[]' | 'date[]';

export type ValidationErrorCode =
  'INVALID_TYPE' | 'SAFE_PARSE_FAILED' | 'CUSTOM_VALIDATION_FAILED' | 'INVALID_SORT_FIELD';

export type ValidationError = {
  field: string;
  message: string;
  code: ValidationErrorCode;
};

export type ValidationResult = {
  success: boolean;
  errors: ValidationError[];
};

export type CustomValidatorFn<ValType = unknown> = (
  value: ValType,
  operator: QueryParamsOperator<unknown, ValType>
) => boolean | string | void;

export type CustomValidators<T extends object> = {
  [K in QueryableFields<T>]?: CustomValidatorFn<T[K]> | CustomValidatorFn<T[K]>[];
};

export type FieldValidationDefinition<ValType = unknown> = {
  type: FieldTypes;
  validate?: CustomValidatorFn<ValType> | CustomValidatorFn<ValType>[];
};

export type QueryShapeSchema<T extends object> = {
  [K in QueryableFields<T>]?: FieldTypes | FieldValidationDefinition<T[K]> | boolean;
};
