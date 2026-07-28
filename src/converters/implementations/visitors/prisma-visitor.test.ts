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
import { UnsupportedOperatorError } from '../../../converters/core/unsupported-operator-error';
import { PrismaVisitor } from './prisma-visitor';

describe('PrismaVisitor', () => {
  const visitor = new PrismaVisitor();

  // ---------------------------------------------------------------------------
  describe('visitEquals / visitNotEquals', () => {
    it('deve gerar filtro de igualdade com valor escalar', () => {
      const op = new EqualsOperator('==val');
      expect(visitor.visitEquals(op, 'field')).toEqual({ field: 'val' });
    });

    it('deve gerar filtro de negação com valor escalar', () => {
      const op = new NotEqualsOperator('!=val');
      expect(visitor.visitNotEquals(op, 'field')).toEqual({ field: { not: 'val' } });
    });

    it('deve gerar filtro de igualdade com valor numérico', () => {
      const op = new EqualsOperator('==42');
      expect(visitor.visitEquals(op, 'count')).toEqual({ count: 42 });
    });
  });

  // ---------------------------------------------------------------------------
  describe('visitIn / visitNotIn', () => {
    it('deve gerar filtro IN com múltiplos valores', () => {
      const op = new InOperator('in=v1,v2');
      expect(visitor.visitIn(op, 'field')).toEqual({ field: { in: ['v1', 'v2'] } });
    });

    it('deve gerar filtro NOT IN com múltiplos valores', () => {
      const op = new NotInOperator('out=v1,v2');
      expect(visitor.visitNotIn(op, 'field')).toEqual({ field: { notIn: ['v1', 'v2'] } });
    });
  });

  // ---------------------------------------------------------------------------
  describe('visitGreaterThan / visitGreaterThanOrEquals / visitLessThan / visitLessThanOrEquals', () => {
    it('deve gerar filtro gt', () => {
      const op = new GreaterThanOperator('gt=10');
      expect(visitor.visitGreaterThan(op, 'field')).toEqual({ field: { gt: 10 } });
    });

    it('deve gerar filtro gte', () => {
      const op = new GreaterThanOrEqualsOperator('gte=10');
      expect(visitor.visitGreaterThanOrEquals(op, 'field')).toEqual({ field: { gte: 10 } });
    });

    it('deve gerar filtro lt', () => {
      const op = new LessThanOperator('lt=10');
      expect(visitor.visitLessThan(op, 'field')).toEqual({ field: { lt: 10 } });
    });

    it('deve gerar filtro lte', () => {
      const op = new LessThanOrEqualsOperator('lte=10');
      expect(visitor.visitLessThanOrEquals(op, 'field')).toEqual({ field: { lte: 10 } });
    });
  });

  // ---------------------------------------------------------------------------
  describe('visitContains', () => {
    it('deve gerar filtro contains com mode insensitive', () => {
      const op = new ContainsOperator('~=val');
      expect(visitor.visitContains(op, 'field')).toEqual({
        field: { contains: 'val', mode: 'insensitive' },
      });
    });

    it('deve preservar valor com espaços internos', () => {
      const op = new ContainsOperator('~=hello world');
      expect(visitor.visitContains(op, 'title')).toEqual({
        title: { contains: 'hello world', mode: 'insensitive' },
      });
    });

    it('deve preservar valor vazio como string vazia', () => {
      const op = new ContainsOperator('~=');
      expect(visitor.visitContains(op, 'field')).toEqual({
        field: { contains: '', mode: 'insensitive' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('visitNotContains', () => {
    it('deve gerar filtro not contains com mode insensitive no nível correto', () => {
      // Regressão: `mode` deve ser irmão de `not`, NÃO aninhado dentro dele.
      // O Prisma não aceita `mode` em `NestedStringFilter`.
      const op = new NotContainsOperator('!~=val');
      expect(visitor.visitNotContains(op, 'field')).toEqual({
        field: { not: { contains: 'val' }, mode: 'insensitive' },
      });
    });

    it('deve garantir que mode NÃO está dentro de not (regressão bug !~= operator)', () => {
      const op = new NotContainsOperator('!~=val');
      const result = visitor.visitNotContains(op, 'field');

      const fieldFilter = result['field'] as Record<string, unknown>;

      // mode deve existir no nível raiz do filtro do campo
      expect(fieldFilter).toHaveProperty('mode', 'insensitive');

      // mode NÃO deve existir dentro do objeto `not`
      const notFilter = fieldFilter['not'] as Record<string, unknown>;
      expect(notFilter).not.toHaveProperty('mode');
    });

    it('deve preservar valor com espaços internos', () => {
      const op = new NotContainsOperator('!~=hello world');
      expect(visitor.visitNotContains(op, 'title')).toEqual({
        title: { not: { contains: 'hello world' }, mode: 'insensitive' },
      });
    });

    it('deve ter paridade estrutural de mode com visitContains', () => {
      const containsOp = new ContainsOperator('~=x');
      const notContainsOp = new NotContainsOperator('!~=x');

      const containsResult = visitor.visitContains(containsOp, 'f') as Record<
        string,
        Record<string, unknown>
      >;
      const notContainsResult = visitor.visitNotContains(notContainsOp, 'f') as Record<
        string,
        Record<string, unknown>
      >;

      // Ambos devem expor `mode` no nível raiz do filtro do campo
      expect(containsResult['f']).toHaveProperty('mode', 'insensitive');
      expect(notContainsResult['f']).toHaveProperty('mode', 'insensitive');
    });
  });

  // ---------------------------------------------------------------------------
  describe('visitBetween', () => {
    it('deve gerar filtro de intervalo numérico', () => {
      const op = new BetweenOperator('btw=1,10');
      expect(visitor.visitBetween(op, 'field')).toEqual({
        field: { gte: 1, lte: 10 },
      });
    });

    it('deve lançar erro quando o valor do operador for nulo', () => {
      const op = new BetweenOperator('btw=1,10');
      vi.spyOn(op, 'value').mockReturnValue(null as any);
      expect(() => visitor.visitBetween(op, 'field')).toThrow(
        'Invalid value for Between operator on field "field".'
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe('visitArrayContains', () => {
    it('deve gerar hasEvery para múltiplos valores', () => {
      const op = new ArrayContainsOperator('@>v1,v2');
      expect(visitor.visitArrayContains(op, 'field')).toEqual({
        field: { hasEvery: ['v1', 'v2'] },
      });
    });

    it('deve gerar has para valor escalar (não-array)', () => {
      const op = new ArrayContainsOperator('@>v1');
      vi.spyOn(op, 'value').mockReturnValue('v1' as any);
      expect(visitor.visitArrayContains(op, 'field')).toEqual({
        field: { has: 'v1' },
      });
    });

    it('deve gerar hasEvery para array vazio', () => {
      const op = new ArrayContainsOperator('@>');
      vi.spyOn(op, 'value').mockReturnValue([] as any);
      expect(visitor.visitArrayContains(op, 'field')).toEqual({
        field: { hasEvery: [] },
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('visitArrayOverlap', () => {
    it('deve gerar hasSome para múltiplos valores', () => {
      const op = new ArrayOverlapOperator('&&v1,v2');
      expect(visitor.visitArrayOverlap(op, 'field')).toEqual({
        field: { hasSome: ['v1', 'v2'] },
      });
    });

    it('deve gerar has para valor escalar (não-array)', () => {
      const op = new ArrayOverlapOperator('&&v1');
      vi.spyOn(op, 'value').mockReturnValue('v1' as any);
      expect(visitor.visitArrayOverlap(op, 'field')).toEqual({
        field: { has: 'v1' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('visitArrayIsContainedBy', () => {
    it('deve lançar UnsupportedOperatorError', () => {
      const op = new ArrayIsContainedByOperator('itb=[v1,v2]');
      expect(() => visitor.visitArrayIsContainedBy(op, 'field')).toThrow(UnsupportedOperatorError);
    });
  });

  // ---------------------------------------------------------------------------
  describe('visitUnknown', () => {
    it('deve retornar o valor direto quando não-nulo', () => {
      const op = new UnknownOperator('val');
      expect(visitor.visitUnknown(op, 'field')).toEqual({ field: 'val' });
    });

    it('deve retornar objeto vazio quando o valor for nulo', () => {
      const op = new UnknownOperator('val');
      vi.spyOn(op, 'value').mockReturnValue(null as any);
      expect(visitor.visitUnknown(op, 'field')).toEqual({});
    });

    it('deve retornar objeto vazio quando o valor for undefined', () => {
      const op = new UnknownOperator('val');
      vi.spyOn(op, 'value').mockReturnValue(undefined as any);
      expect(visitor.visitUnknown(op, 'field')).toEqual({});
    });
  });
});
