import type { SortDirection } from '../../common';

/**
 * Interface para conversores que transformam parâmetros de ordenação.
 * @template T - Tipo de retorno da conversão
 */
export interface ISortConverter<T> {
  sort(sort?: Record<string, SortDirection>): T | undefined;
}
