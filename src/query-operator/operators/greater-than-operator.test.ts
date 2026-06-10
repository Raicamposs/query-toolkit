import { describe, expect, it, vi } from 'vitest';
import type { OperatorVisitor } from '../../converters';
import { GreaterThanOperator } from './greater-than-operator';

describe('GreaterThanOperator', () => {
  it('deve parsear valor numerico corretamente', () => {
    const operator = new GreaterThanOperator('gt=18');
    expect(operator.value()).toBe(18);
  });

  it('deve parsear string de data corretamente', () => {
    const operator = new GreaterThanOperator('gt=2024-01-01');
    const value = operator.value() as Date;
    expect(value).toBeInstanceOf(Date);
    expect(value.toISOString()).toContain('2024-01-01');
  });

  it('deve retornar null para valor string literal (nao e numero nem data)', () => {
    const operator = new GreaterThanOperator('gt=abc');
    expect(operator.value()).toBeNull();
    expect(operator.safeParse().success).toBe(false);
  });

  it('deve retornar query object de gt', () => {
    const operator = new GreaterThanOperator('gt=25');
    expect(operator.query()).toEqual({ gt: 25 });
  });

  it('deve aceitar o visitor correspondente ao greaterThan', () => {
    const operator = new GreaterThanOperator('gt=10');
    const visitor = {
      visitGreaterThan: vi.fn().mockReturnValue('gt-visited'),
    } as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'age');
    expect(visitor.visitGreaterThan).toHaveBeenCalledWith(operator, 'age');
    expect(result).toBe('gt-visited');
  });
});
