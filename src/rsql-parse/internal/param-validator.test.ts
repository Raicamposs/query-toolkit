import { describe, expect, it } from 'vitest';
import { EqualsOperator, GreaterThanOperator } from '../../query-operator';
import { validateParams } from './param-validator';
import { QueryableFields, ParamsOperators, FieldTypes } from '../../common/types';

interface TestUser {
  name: string;
  age: number;
  ages: number;
}

describe('validateParams', () => {
  it('deve retornar sucesso se nao houver operadores ou chaves de validacao', () => {
    const result = validateParams<TestUser>({} as any, new Map());
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('deve validar tipos com sucesso', () => {
    const operatorsObj: ParamsOperators<TestUser> = {
      name: [new EqualsOperator('==John')],
      age: [new GreaterThanOperator('gt=18')],
    } as any;

    const validKeys = new Map<QueryableFields<TestUser>, FieldTypes>([
      ['name', 'string'],
      ['age', 'number'],
    ]);

    const result = validateParams<TestUser>(operatorsObj, validKeys);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('deve falhar se o tipo do parametro nao corresponder ao shape', () => {
    const operatorsObj: ParamsOperators<TestUser> = {
      age: [new EqualsOperator('==not-a-number')],
    } as any;

    const validKeys = new Map<QueryableFields<TestUser>, FieldTypes>([['age', 'number']]);

    const result = validateParams<TestUser>(operatorsObj, validKeys);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("expected type 'number'");
  });

  it('deve validar arrays de valores correspondentes', () => {
    const operatorsObj: ParamsOperators<TestUser> = {
      ages: [new EqualsOperator('==10')],
    } as any;

    const validKeys = new Map<QueryableFields<TestUser>, FieldTypes>([['ages', 'number']]);

    const result = validateParams<TestUser>(operatorsObj, validKeys);
    expect(result.success).toBe(true);
  });
});
