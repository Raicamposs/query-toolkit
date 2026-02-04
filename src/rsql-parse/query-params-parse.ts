import { coalesce, isEmpty, ObjectEntries } from '@raicamposs/toolkit';
import { QueryParamsOperator } from '../query-operator';
import { RsqlQueryParams } from '../types';
import { QueryParamsOperatorFactory } from './query-params-operator-factory';

export class QueryParamsParse<T = any> {
  constructor(private readonly params: RsqlQueryParams<T>) { }

  build(): Record<string, Array<QueryParamsOperator>> {
    const output: Record<string, Array<QueryParamsOperator>> = {};

    const operator = ObjectEntries(coalesce(this.params, {})).reduce((acc, [key, value]) => {
      if (isEmpty(value)) return acc;
      if (isEmpty(key)) return acc;

      if (Array.isArray(value)) {
        value.forEach((item: string) => {
          if (acc[key]) {
            acc[key] = [...acc[key], new QueryParamsOperatorFactory(item).build()];
          } else {
            acc[key] = [new QueryParamsOperatorFactory(item).build()];
          }
        });
        return acc;
      }
      acc[key] = [new QueryParamsOperatorFactory(value as string).build()];
      return acc;
    }, output);

    return output;
  }
}
