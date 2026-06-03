import { describe, expect, it, vi } from 'vitest';
import {
  ArrayContainsOperator,
  ArrayIsContainedByOperator,
  ArrayOverlapOperator,
  BetweenOperator,
  ContainsOperator,
  EqualsOperator,
  GreaterThanOperator,
  GreaterThanOrEqualsOperator,
  InOperator,
  LessThanOperator,
  LessThanOrEqualsOperator,
  NotContainsOperator,
  NotEqualsOperator,
  NotInOperator,
  UnknownOperator,
} from '../../../query-operator';
import { SqlStringVisitor } from './sql-string-visitor';

describe('SqlStringVisitor', () => {
  const visitor = new SqlStringVisitor();

  it('visitEquals — string', () => {
    const op = new EqualsOperator('==ACTIVE');
    expect(visitor.visitEquals(op, 'status')).toBe("status = 'ACTIVE'");
  });

  it('visitEquals — número', () => {
    const op = new EqualsOperator('==42');
    expect(visitor.visitEquals(op, 'age')).toBe('age = 42');
  });

  it('visitEquals — booleano', () => {
    const op = new EqualsOperator('==true');
    expect(visitor.visitEquals(op, 'ativo')).toBe('ativo = true');
  });

  it('visitNotEquals', () => {
    const op = new NotEqualsOperator('!=DELETED');
    expect(visitor.visitNotEquals(op, 'status')).toBe("status != 'DELETED'");
  });

  it('visitIn', () => {
    const op = new InOperator('in=ADMIN,USER');
    expect(visitor.visitIn(op, 'role')).toBe("role IN ('ADMIN', 'USER')");
  });

  it('visitNotIn', () => {
    const op = new NotInOperator('out=GUEST,BOT');
    expect(visitor.visitNotIn(op, 'role')).toBe("role NOT IN ('GUEST', 'BOT')");
  });

  it('visitGreaterThan', () => {
    const op = new GreaterThanOperator('gt=18');
    expect(visitor.visitGreaterThan(op, 'age')).toBe('age > 18');
  });

  it('visitGreaterThanOrEquals', () => {
    const op = new GreaterThanOrEqualsOperator('gte=18');
    expect(visitor.visitGreaterThanOrEquals(op, 'age')).toBe('age >= 18');
  });

  it('visitLessThan', () => {
    const op = new LessThanOperator('lt=100');
    expect(visitor.visitLessThan(op, 'price')).toBe('price < 100');
  });

  it('visitLessThanOrEquals', () => {
    const op = new LessThanOrEqualsOperator('lte=100');
    expect(visitor.visitLessThanOrEquals(op, 'price')).toBe('price <= 100');
  });

  it('visitContains — ILIKE com %', () => {
    const op = new ContainsOperator('~=john');
    expect(visitor.visitContains(op, 'name')).toBe("name ILIKE '%john%'");
  });

  it('visitNotContains — NOT ILIKE com %', () => {
    const op = new NotContainsOperator('!~=draft');
    expect(visitor.visitNotContains(op, 'title')).toBe("title NOT ILIKE '%draft%'");
  });

  it('visitBetween — BETWEEN', () => {
    const op = new BetweenOperator('btw=5000,8000');
    expect(visitor.visitBetween(op, 'salary')).toBe('salary BETWEEN 5000 AND 8000');
  });

  it('visitBetween — lança erro para valor inválido', () => {
    const op = new BetweenOperator('btw=5000');
    expect(() => visitor.visitBetween(op, 'salary')).toThrow(
      'Valor inválido para operador Between no campo "salary".'
    );
  });

  it('visitArrayContains — @>', () => {
    const op = new ArrayContainsOperator('@>typescript,node');
    expect(visitor.visitArrayContains(op, 'tags')).toBe("tags @> ARRAY['typescript', 'node']");
  });

  it('visitArrayIsContainedBy — <@', () => {
    const op = new ArrayIsContainedByOperator('<@typescript,node');
    expect(visitor.visitArrayIsContainedBy(op, 'tags')).toBe("tags <@ ARRAY['typescript', 'node']");
  });

  it('visitArrayOverlap — &&', () => {
    const op = new ArrayOverlapOperator('&&javascript,html');
    expect(visitor.visitArrayOverlap(op, 'tags')).toBe("tags && ARRAY['javascript', 'html']");
  });

  it('visitUnknown — com valor', () => {
    const op = new UnknownOperator('teste');
    expect(visitor.visitUnknown(op, 'campo')).toBe("campo = 'teste'");
  });

  it('visitUnknown — com valor nulo retorna string vazia', () => {
    const op = new UnknownOperator('nulo');
    vi.spyOn(op, 'value').mockReturnValue(null);
    expect(visitor.visitUnknown(op, 'campo')).toBe('');
  });

  it('escapa aspas simples no valor', () => {
    const op = new EqualsOperator("==O'Brien");
    expect(visitor.visitEquals(op, 'name')).toBe("name = 'O''Brien'");
  });
});
