import { parseRsqlValue } from '../common/date-parser';
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
import { OperatorSymbol, OperatorSymbolType } from '../types/operator-symbol';

export type OperatorResolver = (params: string) => QueryParamsOperator;

/**
 * Função utilitária para fazer o parse de valores no formato de lista (separados por vírgula) do RSQL.
 * Pode ser usada por desenvolvedores externos ao registrar novos operadores de lista.
 */
export function parseRsqlListValue(
  params: string,
  symbol: string
): Array<string | boolean | number | Date> {
  if (!params.includes(symbol)) {
    return [];
  }
  const [, rawValue] = params.split(symbol);
  if (!rawValue) {
    return [];
  }
  return rawValue
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v !== '')
    .map((v) => parseRsqlValue(v));
}

/**
 * Registry dinâmico de operadores RSQL.
 * Facilita a extensibilidade da biblioteca em conformidade com o Open/Closed Principle (OCP).
 */
export class OperatorRegistry {
  private static readonly resolvers = new Map<OperatorSymbolType, OperatorResolver>();

  /**
   * Registra um novo operador na biblioteca associado a um símbolo específico.
   * @param symbol Símbolo RSQL do operador (ex: "==", "gt=").
   * @param resolver Função criadora (factory function) do operador correspondente.
   */
  static register(symbol: OperatorSymbolType, resolver: OperatorResolver): void {
    this.resolvers.set(symbol, resolver);
  }

  /**
   * Resolve e instancia um operador correspondente a partir dos parâmetros de string.
   * @param params String RSQL completa (ex: "==Brazil", "gt=50").
   */
  static resolve(params: string): QueryParamsOperator {
    let bestSymbol = '';
    let bestResolver: OperatorResolver | null = null;

    // Busca pela correspondência mais longa para evitar colisões de prefixos parecidos (ex: ">" vs ">=")
    for (const [symbol, resolver] of this.resolvers.entries()) {
      if (params.startsWith(symbol) && symbol.length > bestSymbol.length) {
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
    this.resolvers.clear();
  }
}

// Registro imediato e estático de todos os operadores padrão da biblioteca
OperatorRegistry.register(OperatorSymbol.equals, (params) => new EqualsOperator(params));
OperatorRegistry.register(OperatorSymbol.notEquals, (params) => new NotEqualsOperator(params));
OperatorRegistry.register(OperatorSymbol.ilike, (params) => new ContainsOperator(params));
OperatorRegistry.register(OperatorSymbol.notLike, (params) => new NotContainsOperator(params));
OperatorRegistry.register(OperatorSymbol.between, (params) => new BetweenOperator(params));
OperatorRegistry.register(OperatorSymbol.greaterThan, (params) => new GreaterThanOperator(params));
OperatorRegistry.register(
  OperatorSymbol.greaterThanOrEqual,
  (params) => new GreaterThanOrEqualsOperator(params)
);
OperatorRegistry.register(OperatorSymbol.lessThan, (params) => new LessThanOperator(params));
OperatorRegistry.register(
  OperatorSymbol.lessThanOrEqual,
  (params) => new LessThanOrEqualOperator(params)
);
OperatorRegistry.register(
  OperatorSymbol.arrayIsContainedBy,
  (params) => new ArrayIsContainedByOperator(params)
);
OperatorRegistry.register(
  OperatorSymbol.arrayContains,
  (params) => new ArrayContainsOperator(params)
);
OperatorRegistry.register(
  OperatorSymbol.arrayOverlap,
  (params) => new ArrayOverlapOperator(params)
);

// Operadores que exigem parser específico de lista RSQL
OperatorRegistry.register(
  OperatorSymbol.in,
  (params) => new InOperator(parseRsqlListValue(params, OperatorSymbol.in))
);
OperatorRegistry.register(
  OperatorSymbol.notIn,
  (params) => new NotInOperator(parseRsqlListValue(params, OperatorSymbol.notIn))
);
