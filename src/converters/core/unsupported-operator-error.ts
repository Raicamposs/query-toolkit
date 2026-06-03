/**
 * Lançado quando um visitor não suporta um determinado operador para um campo específico.
 * Permite que o chamador distinga falhas de operador não suportado de outros erros
 * sem precisar fazer parse de strings de mensagem.
 *
 * @example
 * try {
 *   converter.build();
 * } catch (e) {
 *   if (e instanceof UnsupportedOperatorError) {
 *     console.warn(`Operador "${e.operatorSymbol}" não suportado no campo "${e.field}"`);
 *   }
 * }
 */
export class UnsupportedOperatorError extends Error {
  constructor(
    public readonly operatorSymbol: string,
    public readonly field: string
  ) {
    super(`Operador "${operatorSymbol}" não é suportado para o campo "${field}" neste contexto.`);
    this.name = 'UnsupportedOperatorError';
  }
}
