import type { ArrayContainsOperator } from '../../query-operator/operators/array-contains-operator';
import type { ArrayIsContainedByOperator } from '../../query-operator/operators/array-is-contained-by-operator';
import type { ArrayOverlapOperator } from '../../query-operator/operators/array-overlap-operator';
import type { BetweenOperator } from '../../query-operator/operators/between-operator';
import type { ContainsOperator } from '../../query-operator/operators/contains-operator';
import type { EqualsOperator } from '../../query-operator/operators/equals-operator';
import type { GreaterThanOperator } from '../../query-operator/operators/greater-than-operator';
import type { GreaterThanOrEqualsOperator } from '../../query-operator/operators/greater-than-or-equals-operator';
import type { InOperator } from '../../query-operator/operators/in-operator';
import type { LessThanOperator } from '../../query-operator/operators/less-than-operator';
import type { LessThanOrEqualsOperator } from '../../query-operator/operators/less-than-or-equals-operator';
import type { NotContainsOperator } from '../../query-operator/operators/not-contains-operator';
import type { NotEqualsOperator } from '../../query-operator/operators/not-equals-operator';
import type { NotInOperator } from '../../query-operator/operators/not-in-operator';
import type { UnknownOperator } from '../../query-operator/operators/unknown-operator';
import type { QueryParamsOperator } from '../../query-operator/query-params-operator';
import type { OperatorVisitor } from './operator-visitor';

type CustomHandler<T> = (operator: QueryParamsOperator<unknown, unknown>, field: string) => T;

/**
 * Classe base abstrata para implementações de OperatorVisitor.
 *
 * Fornece despacho automático via `visitCustom()`: registre um handler por símbolo
 * com `registerHandler()` e operadores criados com `CustomQueryParamsOperator` serão
 * roteados automaticamente. Operadores sem handler registrado fazem fallback para `visitUnknown()`.
 *
 * @example
 * class MeuVisitor extends BaseOperatorVisitor<MeuResultado> {
 *   // implementar todos os métodos visitXxx...
 * }
 *
 * const visitor = new MeuVisitor()
 *   .registerHandler('regex=', (op, field) => buildRegexClause(field, op.value()));
 */
export abstract class BaseOperatorVisitor<T> implements OperatorVisitor<T> {
  private readonly customHandlers = new Map<string, CustomHandler<T>>();

  /**
   * Registra um handler para um símbolo de operador customizado.
   * Retorna `this` para encadeamento.
   */
  registerHandler(symbol: string, handler: CustomHandler<T>): this {
    this.customHandlers.set(symbol, handler);
    return this;
  }

  /**
   * Despacha para o handler registrado para o símbolo do operador,
   * ou faz fallback para `visitUnknown()` se nenhum handler estiver registrado.
   */
  visitCustom(operator: QueryParamsOperator<unknown, unknown>, field: string): T {
    const handler = this.customHandlers.get(operator.symbol);
    if (handler) return handler(operator, field);
    // Cast seguro: visitUnknown usa apenas operator.value(), disponível em todos os operadores.
    return this.visitUnknown(operator as UnknownOperator, field);
  }

  abstract visitEquals(operator: EqualsOperator, field: string): T;
  abstract visitNotEquals(operator: NotEqualsOperator, field: string): T;
  abstract visitIn(operator: InOperator, field: string): T;
  abstract visitNotIn(operator: NotInOperator, field: string): T;
  abstract visitGreaterThan(operator: GreaterThanOperator, field: string): T;
  abstract visitGreaterThanOrEquals(operator: GreaterThanOrEqualsOperator, field: string): T;
  abstract visitLessThan(operator: LessThanOperator, field: string): T;
  abstract visitLessThanOrEquals(operator: LessThanOrEqualsOperator, field: string): T;
  abstract visitContains(operator: ContainsOperator, field: string): T;
  abstract visitNotContains(operator: NotContainsOperator, field: string): T;
  abstract visitBetween(operator: BetweenOperator, field: string): T;
  abstract visitArrayContains(operator: ArrayContainsOperator, field: string): T;
  abstract visitArrayIsContainedBy(operator: ArrayIsContainedByOperator, field: string): T;
  abstract visitArrayOverlap(operator: ArrayOverlapOperator, field: string): T;
  abstract visitUnknown(operator: UnknownOperator, field: string): T;
}
