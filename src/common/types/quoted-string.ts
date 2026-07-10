/** Valor totalmente envolvido por um par casado de aspas simples ou duplas. */
const QUOTED_STRING_REGEX = /^(".*"|'.*')$/;

/** Verifica se o valor está envolvido por um par casado de aspas ("..." ou '...'). */
export function isQuotedString(value: string): boolean {
  return QUOTED_STRING_REGEX.test(value);
}

/** Envolve o valor em aspas duplas caso ainda não esteja entre aspas casadas. */
export function ensureQuoted(value: string): string {
  return isQuotedString(value) ? value : `"${value}"`;
}
