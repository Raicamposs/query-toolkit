import { ObjectEntries } from '@raicampos/toolkit';
import type {
  CustomValidatorFn,
  CustomValidators,
  FieldTypes,
  ParamsOperators,
  QueryableFields,
  ValidationError,
  ValidationResult,
} from '../../common/types';
import type { QueryParamsOperator } from '../../query-operator';

/**
 * Valida os operadores analisados contra o schema definido e executa validadores customizados.
 * Retorna um `ValidationResult` com erros estruturados por campo, código e mensagem.
 */
export function validateParams<T extends object>(
  operatorsObj: ParamsOperators<T>,
  validKeys: Map<QueryableFields<T>, FieldTypes>,
  customValidators?: CustomValidators<T>
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, operators] of ObjectEntries(operatorsObj)) {
    const fieldKey = field as QueryableFields<T>;

    if (validKeys.size > 0 && !validKeys.has(fieldKey)) {
      continue;
    }

    const expectedType = validKeys.get(fieldKey);
    const customValidator = customValidators?.[fieldKey];

    for (const operator of operators as Array<QueryParamsOperator<unknown, unknown>>) {
      const parseResult = operator.safeParse();

      if (!parseResult.success) {
        errors.push({
          field: String(field),
          message: parseResult.error,
          code: 'SAFE_PARSE_FAILED',
        });
        continue;
      }

      const value = operator.value();

      if (expectedType) {
        const baseType = expectedType.replace('[]', '');

        const checkType = (v: unknown) => {
          if (baseType === 'date') return v instanceof Date;
          return typeof v === baseType;
        };

        const isInvalid = Array.isArray(value)
          ? value.some((v) => !checkType(v))
          : !checkType(value);

        if (isInvalid) {
          errors.push({
            field: String(field),
            message: `tipo esperado: '${expectedType}'`,
            code: 'INVALID_TYPE',
          });
          continue;
        }
      }

      if (customValidator) {
        const runValidator = (fn: CustomValidatorFn<T[QueryableFields<T>]>) => {
          try {
            const result = fn(
              value as T[QueryableFields<T>],
              operator as QueryParamsOperator<unknown, T[QueryableFields<T>]>
            );

            if (result === false) {
              errors.push({
                field: String(field),
                message: 'validação falhou',
                code: 'CUSTOM_VALIDATION_FAILED',
              });
            } else if (typeof result === 'string') {
              errors.push({
                field: String(field),
                message: result,
                code: 'CUSTOM_VALIDATION_FAILED',
              });
            }
          } catch (err: unknown) {
            errors.push({
              field: String(field),
              message: err instanceof Error ? err.message : String(err),
              code: 'CUSTOM_VALIDATION_FAILED',
            });
          }
        };

        if (Array.isArray(customValidator)) {
          customValidator.forEach(runValidator);
        } else {
          runValidator(customValidator);
        }
      }
    }
  }

  return { success: errors.length === 0, errors };
}
