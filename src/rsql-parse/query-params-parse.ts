import { coalesce, isEmpty, ObjectEntries } from '@raicamposs/toolkit';
import { QueryParamsOperator } from '../query-operator';
import { QueryParamsOperatorFactory } from './query-params-operator-factory';

export class QueryParamsParse {
  constructor(private readonly params: Record<string, string>) {}

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
      acc[key] = [new QueryParamsOperatorFactory(value).build()];
      return acc;
    }, output);

    return operator;
  }
}
