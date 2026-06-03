import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { InOperator } from './in-operator';

describe('InOperator', () => {
  it('deve retornar a lista de valores fornecida no construtor', () => {
    const operator = new InOperator('("v1","v2",3)');
    expect(operator.value()).toEqual(['v1', 'v2', 3]);
  });

  it('deve tratar input sem formato de lista como array de um elemento', () => {
    const operator = new InOperator('not-an-array');
    expect(Array.isArray(operator.value())).toBe(true);
    expect(operator.value()).toHaveLength(1);
  });

  it('deve retornar query object de in', () => {
    const operator = new InOperator('("v1","v2")');
    expect(operator.query()).toEqual({ in: ['v1', 'v2'] });
  });

  it('deve aceitar o visitor correspondente ao in', () => {
    const operator = new InOperator('("v1")');
    const visitor = {
      visitIn: vi.fn().mockReturnValue('in-visited'),
    } as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'status');
    expect(visitor.visitIn).toHaveBeenCalledWith(operator, 'status');
    expect(result).toBe('in-visited');
  });
});
