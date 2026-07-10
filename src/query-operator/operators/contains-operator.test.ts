import { describe, expect, it, vi } from 'vitest';
import type { OperatorVisitor } from '../../converters';
import { ContainsOperator } from './contains-operator';

describe('ContainsOperator', () => {
  it('deve extrair a string do parâmetro bruto e remover espacos extras', () => {
    const operator = new ContainsOperator('~=  search_term  ');
    expect(operator.value()).toBe('search_term');
  });

  it('deve retornar query object de contains', () => {
    const operator = new ContainsOperator('~=coffee');
    expect(operator.query()).toEqual({ contains: 'coffee' });
  });

  it('deve aceitar o visitor correspondente ao contains', () => {
    const operator = new ContainsOperator('~=coffee');
    const visitor = {
      visitContains: vi.fn().mockReturnValue('contains-visited'),
    } as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'name');
    expect(visitor.visitContains).toHaveBeenCalledWith(operator, 'name');
    expect(result).toBe('contains-visited');
  });

  it('deve forçar a conversão de valores puramente numéricos para string', () => {
    // Mesmo sem aspas, o ContainsOperator deve envolver com aspas para forçar a string
    const operator1 = new ContainsOperator('~=12345');
    expect(operator1.safeParse().success).toBe(true);
    expect(operator1.value()).toBe('12345');

    // Com aspas já existentes, deve mantê-las e tratá-las corretamente como string
    const operator2 = new ContainsOperator('~="67890"');
    expect(operator2.safeParse().success).toBe(true);
    expect(operator2.value()).toBe('67890');
  });
});
