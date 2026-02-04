import { describe, expect, it } from 'vitest';
import { EqualsOperator } from '../query-operator';
import { QueryParamsParse } from './query-params-parse';

describe('QueryParamsParse', () => {
  it('should parse simple query parameters', () => {
    const params = { name: '==John', age: 'gt=18' };
    const parser = new QueryParamsParse(params);
    const result = parser.build();

    expect(result.name).toHaveLength(1);
    expect(result.name[0]).toBeInstanceOf(EqualsOperator);
    expect(result.age).toHaveLength(1);
    expect(result.age[0].symbol).toBe('gt=');
  });

  it('should handle array parameters', () => {
    const params = { status: ['==active', '==pending'] };
    const parser = new QueryParamsParse(params as any);
    const result = parser.build();

    expect(result.status).toHaveLength(2);
    expect(result.status[0]).toBeInstanceOf(EqualsOperator);
    expect(result.status[1]).toBeInstanceOf(EqualsOperator);
  });

  it('should ignore empty values or keys', () => {
    const params = { name: '', '': '==value' };
    const parser = new QueryParamsParse(params);
    const result = parser.build();

    expect(Object.keys(result)).toHaveLength(0);
  });
});
