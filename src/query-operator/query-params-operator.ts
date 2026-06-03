import { isAssigned, isNullOrUndefined, Nullable } from '@raicampos/toolkit';
import type { OperatorVisitor } from '../converters';

export type QueryParamsOperatorSuccess<ValueType> = {
  success: true;
  value: ValueType;
};

export type QueryParamsOperatorError = {
  success: false;
  error: string;
};

export type QueryParamsOperatorSafeParse<ValueType> =
  | QueryParamsOperatorSuccess<ValueType>
  | QueryParamsOperatorError;

export abstract class QueryParamsOperator<Condition, ValueType> {
  constructor(
    public readonly symbol: string,
    public readonly params: string
  ) {}

  abstract safeParse(): QueryParamsOperatorSafeParse<ValueType>;
  abstract value(): Nullable<ValueType>;
  abstract query(): Nullable<Condition>;

  /**
   * Aceita um visitor para converter este operador para um formato específico.
   * @template T - Tipo de retorno do visitor
   * @param visitor - Implementação do visitor
   * @param field - Nome do campo ao qual este operador se aplica
   */
  abstract accept<T>(visitor: OperatorVisitor<T>, field: string): T;

  protected getRawValue(): string {
    if (!this.params.startsWith(this.symbol)) {
      return this.params;
    }
    return this.params.substring(this.symbol.length).trim();
  }

  isValid(): this is QueryParamsOperatorSuccess<ValueType> {
    return this.safeParse().success;
  }

  isInvalid(): this is QueryParamsOperatorError {
    return !this.safeParse().success;
  }

  isAssigned() {
    return isAssigned(this.value());
  }

  isNullOrUndefined() {
    return isNullOrUndefined(this.value());
  }

  isArray() {
    const value = this.value();
    if (isNullOrUndefined(value)) {
      return false;
    }
    return Array.isArray(value);
  }
}
