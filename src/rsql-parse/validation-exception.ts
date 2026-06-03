import type { ValidationError } from '../common/types';

/**
 * Exceção lançada por `validateOrThrow()` quando a validação falha.
 * Contém o array completo de erros estruturados para tratamento programático.
 *
 * @example
 * try {
 *   parser.validateOrThrow();
 * } catch (e) {
 *   if (e instanceof ValidationException) {
 *     e.errors.forEach(err => {
 *       console.error(`[${err.code}] ${err.field}: ${err.message}`);
 *     });
 *   }
 * }
 */
export class ValidationException extends Error {
  constructor(public readonly errors: ValidationError[]) {
    const resumo = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    super(`Falha na validação: ${resumo}`);
    this.name = 'ValidationException';
  }
}
