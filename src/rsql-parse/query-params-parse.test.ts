import { describe, expect, it } from 'vitest';
import { EqualsOperator } from '../query-operator';
import { QueryParamsParse } from './query-params-parse';
import { OperatorRegistry } from './operator-registry';

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

  it('should parse custom operators registered in OperatorRegistry', () => {
    class CustomFakeOperator extends EqualsOperator {
      constructor(rawValue: string) {
        super(rawValue);
      }
    }

    // Registrar o operador customizado
    OperatorRegistry.register('fake=' as any, (params: string) => {
      const [, value] = params.split('fake=');
      return new CustomFakeOperator(`==${value}`);
    });

    const params = { field: 'fake=value' };
    const parser = new QueryParamsParse(params);
    const result = parser.build();

    expect(result.field).toHaveLength(1);
    expect(result.field[0]).toBeInstanceOf(CustomFakeOperator);
    expect(result.field[0].value()).toBe('value');
  });
});
