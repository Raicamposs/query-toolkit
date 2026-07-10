import { describe, expect, it, vi } from 'vitest';
import type { OperatorVisitor } from '../../converters';
import { NotContainsOperator } from './not-contains-operator';

describe('NotContainsOperator', () => {
  it('deve extrair a string do parâmetro bruto e remover espacos extras', () => {
    const operator = new NotContainsOperator('!~=  search_term  ');
    expect(operator.value()).toBe('search_term');
  });

  it('deve retornar query object de notContains', () => {
    const operator = new NotContainsOperator('!~=coffee');
    expect(operator.query()).toEqual({ notContains: 'coffee' });
  });

  it('deve aceitar o visitor correspondente ao notContains', () => {
    const operator = new NotContainsOperator('!~=coffee');
    const visitor = {
      visitNotContains: vi.fn().mockReturnValue('not-contains-visited'),
    } as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'name');
    expect(visitor.visitNotContains).toHaveBeenCalledWith(operator, 'name');
    expect(result).toBe('not-contains-visited');
  });

  it('deve forçar a conversão de valores puramente numéricos para string', () => {
    // Mesmo sem aspas, o NotContainsOperator deve envolver com aspas para forçar a string
    const operator1 = new NotContainsOperator('!~=12345');
    expect(operator1.safeParse().success).toBe(true);
    expect(operator1.value()).toBe('12345');

    // Com aspas já existentes, deve mantê-las e tratá-las corretamente como string
    const operator2 = new NotContainsOperator('!~="67890"');
    expect(operator2.safeParse().success).toBe(true);
    expect(operator2.value()).toBe('67890');
  });
});
