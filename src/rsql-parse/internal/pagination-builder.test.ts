import { describe, expect, it } from 'vitest';
import { ClassicPage, CursorPage, MAX_PAGE_LIMIT } from '../../common';
import { buildPagination } from './pagination-builder';

describe('buildPagination', () => {
  it('deve retornar undefined se nenhum parametro de paginacao for fornecido', () => {
    const result = buildPagination({});
    expect(result).toBeUndefined();
  });

  it('deve construir ClassicPage com limit e page', () => {
    const result = buildPagination({ limit: 10, page: 2 });
    expect(result).toBeInstanceOf(ClassicPage);
    expect(result?.limit).toBe(10);
    expect((result as ClassicPage).page).toBe(2);
  });

  it('deve construir ClassicPage a partir de offset e limit', () => {
    const result = buildPagination({ limit: 50, offset: 100 });
    expect(result).toBeInstanceOf(ClassicPage);
    expect(result?.limit).toBe(50);
    expect((result as ClassicPage).page).toBe(3); // (100 / 50) + 1
  });

  it('deve construir CursorPage com limit e cursor', () => {
    const result = buildPagination({ limit: 20, cursor: 'token-123' });
    expect(result).toBeInstanceOf(CursorPage);
    expect(result?.limit).toBe(20);
    expect((result as CursorPage).cursor).toBe('token-123');
  });

  it('deve assumir limit padrao de 20 para CursorPage se apenas cursor for enviado', () => {
    const result = buildPagination({ cursor: 'token-abc' });
    expect(result).toBeInstanceOf(CursorPage);
    expect(result?.limit).toBe(20);
    expect((result as CursorPage).cursor).toBe('token-abc');
  });

  it('deve retornar undefined se parametros numericos forem invalidos (NaN)', () => {
    const result1 = buildPagination({ limit: 'invalido', page: 2 });
    expect(result1).toBeUndefined();

    const result2 = buildPagination({ limit: 10, offset: 'invalido' });
    expect(result2).toBeUndefined();
  });

  it('deve aplicar o limite maximo definido de forma defensiva', () => {
    const result = buildPagination({ limit: 9999, page: 1 });
    expect(result?.limit).toBe(MAX_PAGE_LIMIT);
  });
});
