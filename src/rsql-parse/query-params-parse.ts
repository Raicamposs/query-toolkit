import { coalesce, isEmpty, ObjectEntries } from '@raicamposs/toolkit';
import { QueryParamsOperator } from '../query-operator';
import { QueryableFields, RsqlQueryParams } from '../types';
import { OperatorRegistry } from './operator-registry';

export class QueryParamsParse<T> {
  private readonly validKeys: Set<string>;

  constructor(
    private readonly params: RsqlQueryParams<T>,
    shape?: { [K in QueryableFields<T>]: true }
  ) {
    this.validKeys = new Set(shape ? Object.keys(shape) : []);
  }

  build(): Record<string, Array<QueryParamsOperator>> {
    const output: Record<string, Array<QueryParamsOperator>> = {};

    ObjectEntries(coalesce(this.params, {})).reduce((acc, [key, value]) => {
      if (isEmpty(value)) return acc;
      if (isEmpty(key)) return acc;
      if (this.validKeys.size > 0 && !this.validKeys.has(key as string)) return acc;

      if (Array.isArray(value)) {
        value.forEach((item: string) => {
          if (acc[key]) {
            acc[key] = [...acc[key], OperatorRegistry.resolve(item)];
          } else {
            acc[key] = [OperatorRegistry.resolve(item)];
          }
        });
        return acc;
      }
      acc[key] = [OperatorRegistry.resolve(value as string)];
      return acc;
    }, output);

    return output;
  }

  /**
   * Converte os parâmetros RSQL parsados em um objeto com operadores.
   * @returns Objeto com os operadores RSQL.
   */
  asRsqlOperatorsObject() {
    const queryParams = this.build();
    return ObjectEntries(queryParams)
      .map(([key, value]) => {
        const query = value.map((v) => v.query()).reduce((acc, curr) => ({ ...acc, ...curr }), {});
        return { [key]: query };
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {});
  }
}
