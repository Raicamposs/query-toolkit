import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { BetweenOperator } from './between-operator';

describe('BetweenOperator', () => {
  it('should parse range values', () => {
    const operator = new BetweenOperator('btw=1,10');
    expect(operator.value()).toEqual({ gte: 1, lte: 10 });
  });

  it('should parse date range values', () => {
    const operator = new BetweenOperator('btw=2024-01-01,2024-01-31');
    const value = operator.value() as { gte: Date; lte: Date };
    expect(value.gte).toBeInstanceOf(Date);
    expect(value.lte).toBeInstanceOf(Date);
    expect(value.gte.toISOString()).toContain('2024-01-01');
    expect(value.lte.toISOString()).toContain('2024-01-31');
  });

  it('should return query object', () => {
    const operator = new BetweenOperator('btw=10,20');
    expect(operator.query()).toEqual({ gte: 10, lte: 20 });
  });

  it('should accept visitor', () => {
    const operator = new BetweenOperator('btw=1,10');
    const visitor: OperatorVisitor<string> = {
      visitBetween: vi.fn().mockReturnValue('visited'),
    };

    const result = operator.accept(visitor, 'field');
    expect(visitor.visitBetween).toHaveBeenCalledWith(operator, 'field');
    expect(result).toBe('visited');
  });
});
