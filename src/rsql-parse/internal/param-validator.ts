import { ObjectEntries } from '@raicampos/toolkit';
import {
  QueryableFields,
  ParamsOperators,
  FieldTypes,
  CustomValidators,
  CustomValidatorFn,
} from '../../common/types';
import { QueryParamsOperator } from '../../query-operator';

/**
 * Valida se os operadores analisados correspondem aos tipos especificados na forma (shape) definida,
 * além de rodar quaisquer validadores customizados providos.
 * @param operatorsObj Objeto com os operadores mapeados por campo.
 * @param validKeys Mapeamento de chaves válidas e seus respectivos tipos.
 * @param customValidators Mapeamento opcional de funções validadoras adicionais por campo.
 * @returns Um objeto indicando o sucesso e uma lista de erros, se existirem.
 */
export function validateParams<T extends object>(
  operatorsObj: ParamsOperators<T>,
  validKeys: Map<QueryableFields<T>, FieldTypes>,
  customValidators?: CustomValidators<T>
): { success: boolean; errors: string[] } {
  const validationErrors: string[] = [];

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
        validationErrors.push(`Field '${field}': ${parseResult.error}`);
        continue;
      }

      const value = operator.value();

      if (expectedType) {
        const baseType = expectedType.replace('[]', '');

        const checkType = (v: unknown) => {
          if (baseType === 'date') {
            return v instanceof Date;
          }
          return typeof v === baseType;
        };

        const isInvalid = Array.isArray(value)
          ? value.some((v) => !checkType(v))
          : !checkType(value);

        if (isInvalid) {
          validationErrors.push(`Field '${field}': expected type '${expectedType}'.`);
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
              validationErrors.push(`Field '${field}': validation failed.`);
            } else if (typeof result === 'string') {
              validationErrors.push(`Field '${field}': ${result}`);
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            validationErrors.push(`Field '${field}': ${message}`);
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

  return {
    success: validationErrors.length === 0,
    errors: validationErrors,
  };
}
