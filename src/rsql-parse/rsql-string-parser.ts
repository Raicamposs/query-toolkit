import type { RsqlQueryParams } from '../common/types';
import { OPERATORS } from '../common/types/operator-symbol';

const WORD_CHAR_REGEX = /^[a-zA-Z0-9_]$/;

function isLowerCaseLetter(char: string): boolean {
  return /^[a-z]$/.test(char);
}

/**
 * Verifica se o operador encontrado está em uma borda válida (evitando correspondência parcial colada a palavras).
 */
function isValidOperatorBoundary(op: string, part: string, index: number): boolean {
  if (index <= 0) {
    return true;
  }
  const isTextOp = isLowerCaseLetter(op.charAt(0));
  if (!isTextOp) {
    return true;
  }
  const prevChar = part[index - 1];
  return !WORD_CHAR_REGEX.test(prevChar);
}

/**
 * Localiza a posição de início de um operador respeitando as bordas de caracteres.
 */
function findOperatorIndex(part: string, op: string): number {
  let startSearch = 0;
  while (startSearch < part.length) {
    const index = part.indexOf(op, startSearch);
    if (index === -1) {
      return -1;
    }

    if (isValidOperatorBoundary(op, part, index)) {
      return index;
    }

    startSearch = index + 1;
  }
  return -1;
}

/**
 * Localiza o primeiro operador RSQL legítimo presente na string.
 */
function findFirstOperator(part: string): { firstOpIndex: number; foundOp: string } {
  let firstOpIndex = -1;
  let foundOp = '';

  for (const op of OPERATORS) {
    const index = findOperatorIndex(part, op);
    if (index === -1) {
      continue;
    }

    if (firstOpIndex === -1 || index < firstOpIndex) {
      firstOpIndex = index;
      foundOp = op;
    }
  }

  return { firstOpIndex, foundOp };
}

/**
 * Determina se uma parte de string é o início de uma nova expressão de filtro.
 */
function isStartOfNewCondition(text: string): boolean {
  return OPERATORS.some((op) => text.includes(op));
}

/**
 * Divide uma expressão lógica baseada no caractere de disjunção (vírgula) respeitando delimitadores de array.
 */
function splitByOrExceptArrays(part: string): string[] {
  const rawParts = part.split(',');
  const validParts: string[] = [];
  let current = '';

  for (const p of rawParts) {
    const candidate = current ? `${current},${p}` : p;

    if (isStartOfNewCondition(p)) {
      if (current) {
        validParts.push(current);
      }
      current = p;
    } else {
      current = candidate;
    }
  }

  if (current) {
    validParts.push(current);
  }
  return validParts;
}

/**
 * Extrai o campo e a representação crua do valor a partir de um fragmento lógico.
 */
function splitPart(part: string): { field: string; rawValue: string } {
  const { firstOpIndex, foundOp } = findFirstOperator(part);

  if (firstOpIndex === -1) {
    return { field: '', rawValue: '' };
  }

  let field = part.substring(0, firstOpIndex).trim();
  const rawValue = part.substring(firstOpIndex).trim();

  if (field.endsWith('=') && !foundOp.startsWith('=')) {
    field = field.substring(0, field.length - 1).trim();
  }

  return { field, rawValue };
}

/**
 * Adiciona ou acumula filtros de campo a uma estrutura de dados de retorno.
 */
function accumulateFieldFilter(
  result: Record<string, string | string[]>,
  field: string,
  rawValue: string
): void {
  const existingValue = result[field];
  if (!existingValue) {
    result[field] = rawValue;
    return;
  }

  if (Array.isArray(existingValue)) {
    existingValue.push(rawValue);
    return;
  }

  result[field] = [existingValue, rawValue];
}

/**
 * Função pura para fazer o parse de uma string RSQL de consulta.
 */
export function parseRsqlString<T = unknown>(filter: string): RsqlQueryParams<T> {
  if (!filter) {
    return {};
  }

  const result: Record<string, string | string[]> = {};
  const andParts = filter.split(';');

  for (const andPart of andParts) {
    const orParts = splitByOrExceptArrays(andPart);

    for (const orPart of orParts) {
      const { field, rawValue } = splitPart(orPart);
      if (!field || !rawValue) {
        continue;
      }

      accumulateFieldFilter(result, field, rawValue);
    }
  }

  return result as RsqlQueryParams<T>;
}

/**
 * Analisador de strings RSQL para conversão de parâmetros brutos da URL em estruturas de dados tipadas.
 *
 * Exemplo: "name==John;age=gt=18"
 */
export class RsqlStringParser<T = unknown> {
  constructor(private readonly filter: string) {}

  /**
   * Executa a análise sintática da string RSQL e converte para o formato RsqlQueryParams.
   * @returns Dicionário contendo os campos mapeados para seus respectivos filtros ou matriz de filtros.
   */
  parse(): RsqlQueryParams<T> {
    return parseRsqlString<T>(this.filter);
  }
}
