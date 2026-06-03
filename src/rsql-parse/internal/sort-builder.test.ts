import { describe, expect, it } from 'vitest';
import { QueryableFields } from '../../common/types';
import { buildSort } from './sort-builder';

interface TestObject {
  name: string;
  age: number;
  secret?: string;
}

describe('buildSort', () => {
  it('deve retornar undefined se o parametro sort nao estiver presente', () => {
    const result = buildSort<TestObject>({}, new Map());
    expect(result).toBeUndefined();
  });

  it('deve retornar undefined se o parametro sort nao for uma string', () => {
    const result = buildSort<TestObject>({ sort: 123 }, new Map());
    expect(result).toBeUndefined();
  });

  it('deve parsear ordenacao simples sem validKeys restritas', () => {
    const validKeys = new Map<QueryableFields<TestObject>, string>();
    const result = buildSort<TestObject>({ sort: 'name:asc,-age' }, validKeys);

    expect(result).toBeDefined();
    expect(result?.name).toBe('asc');
    expect(result?.age).toBe('desc');
  });

  it('deve filtrar campos ordenados com base nas chaves do shape (validKeys)', () => {
    const validKeys = new Map<QueryableFields<TestObject>, string>([
      ['name', 'string'],
      ['age', 'number'],
    ]);
    const result = buildSort<TestObject>({ sort: 'name:asc,-age,secret:desc' }, validKeys);

    expect(result).toBeDefined();
    expect(result?.name).toBe('asc');
    expect(result?.age).toBe('desc');
    expect((result as any).secret).toBeUndefined();
  });
});
