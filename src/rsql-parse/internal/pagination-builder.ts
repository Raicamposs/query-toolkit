import { ClassicPage, CursorPage } from '../../common';

function extractNumericParam(param: unknown): number | undefined {
  if (typeof param !== 'string' && typeof param !== 'number') {
    return undefined;
  }
  const num = Number(param);
  return Number.isNaN(num) ? undefined : num;
}

/**
 * Reconstrói o objeto de paginação clássica ou por cursor a partir dos parâmetros de query.
 * @param params Parâmetros de query recebidos na requisição.
 * @returns Instância de ClassicPage, CursorPage ou undefined.
 */
export function buildPagination(
  params: Record<string, unknown>
): ClassicPage | CursorPage | undefined {
  if ('limit' in params && 'page' in params) {
    const limit = extractNumericParam(params.limit);
    const page = extractNumericParam(params.page);
    if (limit === undefined || page === undefined) {
      return undefined;
    }
    return new ClassicPage(limit, page);
  }

  if ('limit' in params && 'offset' in params) {
    const limit = extractNumericParam(params.limit);
    const offset = extractNumericParam(params.offset);
    if (limit === undefined || offset === undefined) {
      return undefined;
    }
    return ClassicPage.fromOffset(offset, limit);
  }

  if ('limit' in params || 'cursor' in params) {
    const limit = 'limit' in params ? extractNumericParam(params.limit) : 20;
    const cursorValue = 'cursor' in params ? params.cursor : undefined;
    const cursor = typeof cursorValue === 'string' ? cursorValue : undefined;
    if (limit === undefined) {
      return undefined;
    }
    return new CursorPage(limit, cursor);
  }

  return undefined;
}
