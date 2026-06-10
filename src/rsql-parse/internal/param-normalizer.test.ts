import { describe, expect, it } from 'vitest';
import { normalizePlainBoolean, normalizeRsqlBooleanString } from './param-normalizer';

describe('normalizePlainBoolean', () => {
  it('deve converter S e T para "true"', () => {
    expect(normalizePlainBoolean('S')).toBe('true');
    expect(normalizePlainBoolean('T')).toBe('true');
  });

  it('deve converter N e F para "false"', () => {
    expect(normalizePlainBoolean('N')).toBe('false');
    expect(normalizePlainBoolean('F')).toBe('false');
  });

  it('deve ser case-insensitive', () => {
    expect(normalizePlainBoolean('s')).toBe('true');
    expect(normalizePlainBoolean('n')).toBe('false');
  });

  it('deve retornar o valor original quando não for booleano reconhecido', () => {
    expect(normalizePlainBoolean('texto')).toBe('texto');
    expect(normalizePlainBoolean('1')).toBe('1');
    expect(normalizePlainBoolean('')).toBe('');
  });
});

describe('normalizeRsqlBooleanString', () => {
  it('deve retornar o valor original se nao houver operador correspondente', () => {
    const result = normalizeRsqlBooleanString('invalido');
    expect(result).toBe('invalido');
  });

  it('deve normalizar booleanos simples (S, N, TRUE, FALSE, T, F)', () => {
    expect(normalizeRsqlBooleanString('==S')).toBe('==true');
    expect(normalizeRsqlBooleanString('==TRUE')).toBe('==true');
    expect(normalizeRsqlBooleanString('==T')).toBe('==true');

    expect(normalizeRsqlBooleanString('==N')).toBe('==false');
    expect(normalizeRsqlBooleanString('==FALSE')).toBe('==false');
    expect(normalizeRsqlBooleanString('==F')).toBe('==false');
  });

  it('deve normalizar listas booleanas agrupadas por parenteses (in=, out=)', () => {
    expect(normalizeRsqlBooleanString('in=(S,N)')).toBe('in=(true,false)');
    expect(normalizeRsqlBooleanString('out=(TRUE,FALSE)')).toBe('out=(true,false)');
  });

  it('deve preservar o operador intacto com o valor normalizado', () => {
    expect(normalizeRsqlBooleanString('!=TRUE')).toBe('!=true');
    expect(normalizeRsqlBooleanString('gte=S')).toBe('gte=true');
    expect(normalizeRsqlBooleanString('lte=N')).toBe('lte=false');
  });
});
