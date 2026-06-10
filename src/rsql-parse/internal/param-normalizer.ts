import { OPERATORS } from '../../common/types/operator-symbol';

/**
 * Normaliza um valor booleano puro (sem operador RSQL) para 'true' ou 'false'.
 * Aceita: S, T, TRUE → 'true' | N, F, FALSE → 'false' (case-insensitive).
 * Retorna o valor original se não for um booleano reconhecido.
 */
export function normalizePlainBoolean(value: string): string {
  const v = value.trim().toUpperCase();
  if (v === 'S' || v === 'T') return 'true';
  if (v === 'N' || v === 'F') return 'false';
  return value;
}

/**
 * Normaliza os valores de string booleanos vindos do RSQL para representações padronizadas.
 * Exemplo: '==S' ou '==TRUE' torna-se '==true'.
 * @param value Expressão de valor RSQL.
 * @returns Expressão RSQL com os booleanos normalizados.
 */
export function normalizeRsqlBooleanString(value: string): string {
  let matchedOperator = '';

  for (const op of OPERATORS) {
    if (value.startsWith(op) && op.length > matchedOperator.length) {
      matchedOperator = op;
    }
  }

  if (!matchedOperator) {
    return value;
  }

  const operand = value.substring(matchedOperator.length).trim();

  const mapBool = (val: string): string => {
    const v = val.trim().toUpperCase();
    if (v === 'TRUE' || v === 'S' || v === 'T') {
      return 'true';
    }
    if (v === 'FALSE' || v === 'N' || v === 'F') {
      return 'false';
    }
    return val;
  };

  if (operand.startsWith('(') && operand.endsWith(')')) {
    const listContent = operand.slice(1, -1);
    const normalizedList = listContent.split(',').map(mapBool).join(',');
    return `${matchedOperator}(${normalizedList})`;
  }

  return `${matchedOperator}${mapBool(operand)}`;
}
