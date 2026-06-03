import { SortDirection } from '../../../common';
import { QueryableFields } from '../../../common/types';
import { QueryParamsOperator } from '../../../query-operator';
import { QueryParamsConverter } from '../../core/query-params-converter';
import { ISortConverter } from '../../core/sort-converter-interface';
import { SqlStringVisitor } from '../visitors/sql-string-visitor';

/**
 * Conversor que transforma operadores RSQL em uma cláusula WHERE SQL como string.
 *
 * Diferentemente do QueryParamsSqlConverter (que retorna objetos Clause para o SqlBuilder),
 * este conversor é indicado quando você precisa de uma string SQL pronta para uso
 * direto em ORMs, query builders externos ou logging.
 *
 * Os valores são escapados via SqlPrimitiveValue, mantendo proteção contra SQL Injection.
 *
 * @example
 * const rawParams = { name: '~=John', age: ['gte=18', 'lte=60'], status: '==ACTIVE' };
 * const { operators } = new QueryParamsParse(rawParams);
 *
 * const converter = new QueryParamsSqlStringConverter(operators);
 * const where = converter.build();
 * // "name ILIKE '%John%' AND age >= 18 AND age <= 60 AND status = 'ACTIVE'"
 *
 * const orderBy = converter.sort({ name: 'asc', createdAt: 'desc' });
 * // "name ASC, createdAt DESC"
 */
export class QueryParamsSqlStringConverter<T = unknown> implements ISortConverter<string> {
  private readonly converter: QueryParamsConverter<T>;
  private readonly visitor: SqlStringVisitor;

  constructor(
    private readonly operators: Partial<
      Record<
        QueryableFields<T>,
        QueryParamsOperator<unknown, unknown> | QueryParamsOperator<unknown, unknown>[]
      >
    >
  ) {
    this.converter = new QueryParamsConverter<T>(this.operators);
    this.visitor = new SqlStringVisitor();
  }

  /**
   * Retorna a cláusula WHERE completa como string SQL, com todas as condições unidas por AND.
   * Retorna string vazia se não houver operadores.
   */
  build(): string {
    const converted = this.converter.to(this.visitor);
    const conditions: string[] = [];

    for (const fieldConditions of Object.values(converted)) {
      for (const condition of fieldConditions) {
        if (condition) conditions.push(condition);
      }
    }

    return conditions.join(' AND ');
  }

  /**
   * Retorna a cláusula ORDER BY como string SQL.
   * Retorna `undefined` se nenhum campo de ordenação for fornecido.
   *
   * @example
   * converter.sort({ nome: 'asc', criadoEm: 'desc' })
   * // "nome ASC, criadoEm DESC"
   */
  sort(sort?: Record<string, SortDirection>): string | undefined {
    if (!sort) return undefined;
    const entries = Object.entries(sort);
    if (entries.length === 0) return undefined;
    return entries.map(([field, direction]) => `${field} ${direction.toUpperCase()}`).join(', ');
  }

  /**
   * Atalho que retorna WHERE e ORDER BY em uma única chamada.
   *
   * @example
   * const { where, orderBy } = converter.buildQuery({ nome: 'asc' });
   * // where:   "status = 'ACTIVE' AND age >= 18"
   * // orderBy: "nome ASC"
   */
  buildQuery(sort?: Record<string, SortDirection>): { where: string; orderBy: string | undefined } {
    return {
      where: this.build(),
      orderBy: this.sort(sort),
    };
  }
}
