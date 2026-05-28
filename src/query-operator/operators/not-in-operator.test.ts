import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { NotInOperator } from './not-in-operator';

describe('NotInOperator', () => {
  it('deve retornar a lista de valores fornecida no construtor', () => {
    const operator = new NotInOperator('("v1","v2",3)');
    expect(operator.value()).toEqual(['v1', 'v2', 3]);
  });

  it('deve tratar input sem formato de lista como array de um elemento', () => {
    const operator = new NotInOperator('not-an-array');
    expect(Array.isArray(operator.value())).toBe(true);
    expect(operator.value()).toHaveLength(1);
  });

  it('deve retornar query object de notIn', () => {
    const operator = new NotInOperator('("v1","v2")');
    expect(operator.query()).toEqual({ notIn: ['v1', 'v2'] });
  });

  it('deve aceitar o visitor correspondente ao notIn', () => {
    const operator = new NotInOperator('("v1")');
    const visitor = {
      visitNotIn: vi.fn().mockReturnValue('not-in-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'status');
    expect(visitor.visitNotIn).toHaveBeenCalledWith(operator, 'status');
    expect(result).toBe('not-in-visited');
  });
});
