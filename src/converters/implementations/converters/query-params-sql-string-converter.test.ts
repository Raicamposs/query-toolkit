import { describe, expect, it } from 'vitest';
import { QueryParamsParse } from '../../../rsql-parse';
import { QueryParamsSqlStringConverter } from './query-params-sql-string-converter';

interface Produto {
  nome: string;
  preco: number;
  status: string;
  tags: string[];
}

describe('QueryParamsSqlStringConverter', () => {
  describe('build()', () => {
    it('retorna string vazia quando não há operadores', () => {
      const { operators } = new QueryParamsParse<Produto>({});
      expect(new QueryParamsSqlStringConverter(operators).build()).toBe('');
    });

    it('gera condição de igualdade', () => {
      const { operators } = new QueryParamsParse<Produto>({ status: '==ACTIVE' });
      expect(new QueryParamsSqlStringConverter(operators).build()).toBe("status = 'ACTIVE'");
    });

    it('une múltiplos campos com AND', () => {
      const { operators } = new QueryParamsParse<Produto>({
        nome: '~=john',
        status: '==ACTIVE',
      });
      const result = new QueryParamsSqlStringConverter(operators).build();
      expect(result).toContain("nome ILIKE '%john%'");
      expect(result).toContain("status = 'ACTIVE'");
      expect(result).toContain(' AND ');
    });

    it('une múltiplos operadores no mesmo campo com AND', () => {
      const { operators } = new QueryParamsParse<Produto>({
        preco: ['gte=10', 'lte=50'],
      });
      const result = new QueryParamsSqlStringConverter(operators).build();
      expect(result).toBe('preco >= 10 AND preco <= 50');
    });

    it('gera IN para múltiplos valores', () => {
      const { operators } = new QueryParamsParse<Produto>({ status: 'in=ACTIVE,PENDING' });
      expect(new QueryParamsSqlStringConverter(operators).build()).toBe(
        "status IN ('ACTIVE', 'PENDING')"
      );
    });

    it('gera BETWEEN para intervalo', () => {
      const { operators } = new QueryParamsParse<Produto>({ preco: 'btw=10,50' });
      expect(new QueryParamsSqlStringConverter(operators).build()).toBe('preco BETWEEN 10 AND 50');
    });
  });

  describe('buildQuery()', () => {
    it('retorna where e orderBy juntos', () => {
      const { operators } = new QueryParamsParse<Produto>({ status: '==ACTIVE' });
      const result = new QueryParamsSqlStringConverter(operators).buildQuery({ nome: 'asc' });
      expect(result).toEqual({
        where: "status = 'ACTIVE'",
        orderBy: 'nome ASC',
      });
    });

    it('orderBy é undefined quando sort não é fornecido', () => {
      const { operators } = new QueryParamsParse<Produto>({ status: '==ACTIVE' });
      const result = new QueryParamsSqlStringConverter(operators).buildQuery();
      expect(result.where).toBe("status = 'ACTIVE'");
      expect(result.orderBy).toBeUndefined();
    });
  });

  describe('sort()', () => {
    it('retorna undefined sem parâmetro', () => {
      const { operators } = new QueryParamsParse<Produto>({});
      expect(new QueryParamsSqlStringConverter(operators).sort()).toBeUndefined();
    });

    it('retorna undefined para objeto vazio', () => {
      const { operators } = new QueryParamsParse<Produto>({});
      expect(new QueryParamsSqlStringConverter(operators).sort({})).toBeUndefined();
    });

    it('gera ORDER BY para um campo', () => {
      const { operators } = new QueryParamsParse<Produto>({});
      expect(new QueryParamsSqlStringConverter(operators).sort({ nome: 'asc' })).toBe('nome ASC');
    });

    it('gera ORDER BY para múltiplos campos', () => {
      const { operators } = new QueryParamsParse<Produto>({});
      expect(
        new QueryParamsSqlStringConverter(operators).sort({ nome: 'asc', preco: 'desc' })
      ).toBe('nome ASC, preco DESC');
    });
  });
});
