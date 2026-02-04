import { describe, expect, it } from 'vitest';
import { EqualsOperator } from '../query-operator/equals-operator';
import { PrismaVisitor } from './prisma-visitor';
import { QueryParamsConverter } from './query-params-converter';

describe('QueryParamsConverter', () => {
  it('should convert to arbitrary format using visitor', () => {
    const op = new EqualsOperator('==val');
    const converter = new QueryParamsConverter({ name: op });

    const visitor = new PrismaVisitor();
    const result = converter.to(visitor);

    expect(result).toEqual({ name: [{ name: 'val' }] });
  });

  it('should convert to Prisma format and merge clauses', () => {
    const op1 = new EqualsOperator('==val1');
    const op2 = new EqualsOperator('==val2');
    const converter = new QueryParamsConverter({ name: [op1, op2] });

    const result = converter.toPrisma();
    expect(result).toEqual({ name: 'val2' });
  });

  it('should convert to SQL clauses', () => {
    const op = new EqualsOperator('==val');
    const converter = new QueryParamsConverter({ name: op });
    const result = converter.toClauses();
    expect(result.name[0]).toBeDefined();
  });

  it('should convert to SQL clauses array', () => {
    const op = new EqualsOperator('==val');
    const converter = new QueryParamsConverter({ name: op });
    const result = converter.toClausesArray();
    expect(result).toHaveLength(1);
  });
});
