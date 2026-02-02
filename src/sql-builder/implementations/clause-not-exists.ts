import { ClauseExistsBase } from './clause-exists-base';

/**
 * Represents a NOT EXISTS clause for checking if a subquery returns no rows.
 *
 * @example
 * ```typescript
 * const clause = new ClauseNotExists('SELECT 1 FROM users WHERE active = false')
 * clause.build() // Returns: "NOT EXISTS (SELECT 1 FROM users WHERE active = false)"
 * ```
 */
export class ClauseNotExists extends ClauseExistsBase {
  protected getPrefix(): string {
    return 'NOT';
  }
}
