import type { OperatorVisitor } from '../converters';
import { QueryParamsOperator } from './query-params-operator';

/**
 * Classe base para operadores customizados registrados via `OperatorRegistry.register()`.
 *
 * Sobrescreve `accept()` para chamar `visitCustom()` em vez de `visitUnknown()`, habilitando
 * o despacho por símbolo em visitors que estendem `BaseOperatorVisitor`.
 *
 * @example
 * class RegexOperator extends CustomQueryParamsOperator<RegexCondition, string> {
 *   constructor(params: string) { super('regex=', params); }
 *   safeParse() { ... }
 *   value() { ... }
 *   query() { ... }
 * }
 *
 * OperatorRegistry.register('regex=', (params) => new RegexOperator(params));
 *
 * const visitor = new MeuVisitor()
 *   .registerHandler('regex=', (op, field) => ({ [field]: { regex: op.value() } }));
 */
export abstract class CustomQueryParamsOperator<Condition, ValueType> extends QueryParamsOperator<
  Condition,
  ValueType
> {
  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitCustom
      ? visitor.visitCustom(this, field)
      : visitor.visitUnknown(this as never, field);
  }
}
