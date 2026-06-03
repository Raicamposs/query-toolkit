import { PrimitiveValue, PrimitiveValueType } from '../common/types/primitive-value';
import { Nullable } from '@raicampos/toolkit';
import { OperatorSymbol, OperatorSymbolType } from '../common/types/operator-symbol';
import {
  ArrayContainsOperator,
  ArrayIsContainedByOperator,
  ArrayOverlapOperator,
  BetweenOperator,
  ContainsOperator,
  EqualsOperator,
  GreaterThanOperator,
  GreaterThanOrEqualsOperator,
  InOperator,
  LessThanOperator,
  LessThanOrEqualOperator,
  NotContainsOperator,
  NotEqualsOperator,
  NotInOperator,
  QueryParamsOperator,
} from '../query-operator';
import { UnknownOperator } from '../query-operator/operators/unknown-operator';

export type OperatorResolver = (params: string) => QueryParamsOperator<unknown, unknown>;

/**
 * Função utilitária para fazer o parse de valores no formato de lista (separados por vírgula) do RSQL.
 * Pode ser usada por desenvolvedores externos ao registrar novos operadores de lista.
 */
export function parseRsqlListValue(
  params: string,
  symbol: string
): Array<Nullable<PrimitiveValueType>> {
  if (!params.startsWith(symbol)) {
    return [];
  }
  const rawValue = params.substring(symbol.length).trim();
  if (!rawValue) {
    return [];
  }
  return rawValue
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v !== '')
    .map((v) => PrimitiveValue.converter(v).getValue());
}

// Inicialização imediata dos resolvers padrão para evitar lazy loading imperativo
const DEFAULT_RESOLVERS = new Map<OperatorSymbolType, OperatorResolver>([
  [OperatorSymbol.equals, (params) => new EqualsOperator(params)],
  [OperatorSymbol.notEquals, (params) => new NotEqualsOperator(params)],
  [OperatorSymbol.contains, (params) => new ContainsOperator(params)],
  [OperatorSymbol.notContains, (params) => new NotContainsOperator(params)],
  [OperatorSymbol.between, (params) => new BetweenOperator(params)],
  [OperatorSymbol.greaterThan, (params) => new GreaterThanOperator(params)],
  [OperatorSymbol.greaterThanOrEqual, (params) => new GreaterThanOrEqualsOperator(params)],
  [OperatorSymbol.lessThan, (params) => new LessThanOperator(params)],
  [OperatorSymbol.lessThanOrEqual, (params) => new LessThanOrEqualOperator(params)],
  [OperatorSymbol.arrayIsContainedBy, (params) => new ArrayIsContainedByOperator(params)],
  [OperatorSymbol.arrayContains, (params) => new ArrayContainsOperator(params)],
  [OperatorSymbol.arrayOverlap, (params) => new ArrayOverlapOperator(params)],
  [OperatorSymbol.in, (params) => new InOperator(params)],
  [OperatorSymbol.notIn, (params) => new NotInOperator(params)],
]);

const resolvers = new Map<OperatorSymbolType, OperatorResolver>(DEFAULT_RESOLVERS);

/**
 * Registry dinâmico de operadores RSQL.
 * Facilita a extensibilidade da biblioteca em conformidade com o Open/Closed Principle (OCP).
 */
export class OperatorRegistry {
  /**
   * Registra um novo operador na biblioteca associado a um símbolo específico.
   * @param symbol Símbolo RSQL do operador (ex: "==", "gt=").
   * @param resolver Função criadora (factory function) do operador correspondente.
   */
  static register(symbol: OperatorSymbolType, resolver: OperatorResolver): void {
    resolvers.set(symbol, resolver);
  }

  /**
   * Resolve e instancia um operador correspondente a partir dos parâmetros de string.
   * @param params String RSQL completa (ex: "==Brazil", "gt=50").
   */
  static resolve(params: string): QueryParamsOperator<unknown, unknown> {
    let bestSymbol = '';
    let bestResolver: OperatorResolver | null = null;

    // Busca pela correspondência mais longa para evitar colisões de prefixos parecidos (ex: ">" vs ">=")
    for (const [symbol, resolver] of resolvers.entries()) {
      const isMatch = params.startsWith(symbol);
      const isLongerMatch = symbol.length > bestSymbol.length;

      if (isMatch && isLongerMatch) {
        bestSymbol = symbol;
        bestResolver = resolver;
      }
    }

    if (bestResolver) {
      return bestResolver(params);
    }

    return new UnknownOperator(params);
  }

  /**
   * Reseta o Registry removendo todos os operadores registrados.
   */
  static clear(): void {
    resolvers.clear();
  }

  /**
   * Restaura os resolvers padrão do Registry.
   */
  static resetToDefault(): void {
    resolvers.clear();
    for (const [symbol, resolver] of DEFAULT_RESOLVERS.entries()) {
      resolvers.set(symbol, resolver);
    }
  }
}
