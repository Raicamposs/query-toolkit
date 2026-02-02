import { ClauseExistsBase } from './clause-exists-base';

/**
 * Represents an EXISTS clause for checking if a subquery returns any rows.
 *
 * @example
 * ```typescript
 * const clause = new ClauseExists('SELECT 1 FROM users WHERE active = true')
 * clause.build() // Returns: "EXISTS (SELECT 1 FROM users WHERE active = true)"
 * ```
 */
export class ClauseExists extends ClauseExistsBase {
  protected getPrefix(): string {
    return '';
  }
}
