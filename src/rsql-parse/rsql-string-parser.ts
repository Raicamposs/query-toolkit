import { RsqlQueryParams } from '../types';

/**
 * Parses a standard RSQL filter string into a Record of operators.
 * Example: "name==John;age=gt=18"
 */
export class RsqlStringParser<T = any> {
  private static readonly OPERATORS = [
    '==', '!=', '~=', '!~=', 'in=', 'out=', 'btw=', 'gt=', 'gte=', 'lt=', 'lte=', '<@', '@>', '&&'
  ];

  constructor(private readonly filter: string) { }

  parse(): RsqlQueryParams<T> {
    if (!this.filter) return {} as RsqlQueryParams<T>;

    const result: any = {};

    // We split by ; (AND) and , (OR) but only if they are not part of an operator-value.
    // A better approach: split by ; (AND) first as it's the most common top-level separator.
    // In our specific dialect, , is used for OR AND for array values.
    // We'll prioritize operators.

    const andParts = this.filter.split(';');

    for (const andPart of andParts) {
      // For each AND part, we might have OR parts.
      // BUT we must be careful not to split array values in @> or in=.
      // Heuristic: only split by , if the part AFTER , contains another operator.

      const orParts = this.splitByOrExceptArrays(andPart);

      for (const orPart of orParts) {
        const { field, rawValue } = this.splitPart(orPart);
        if (field && rawValue) {
          if (result[field]) {
            if (Array.isArray(result[field])) {
              result[field].push(rawValue);
            } else {
              result[field] = [result[field], rawValue];
            }
          } else {
            result[field] = rawValue;
          }
        }
      }
    }

    return result as RsqlQueryParams<T>;
  }

  private splitByOrExceptArrays(part: string): string[] {
    const rawParts = part.split(',');
    const validParts: string[] = [];
    let current = '';

    for (const p of rawParts) {
      const candidate = current ? `${current},${p}` : p;
      // If candidate after the comma HAS an operator structure (field+op), 
      // then the comma was likely an OR separator.
      // Otherwise, it might be part of an array value.
      if (this.isStartOfNewCondition(p)) {
        if (current) validParts.push(current);
        current = p;
      } else {
        current = candidate;
      }
    }
    if (current) validParts.push(current);
    return validParts;
  }

  private isStartOfNewCondition(text: string): boolean {
    // A new condition starts with field + operator.
    return RsqlStringParser.OPERATORS.some(op => text.includes(op));
  }

  private splitPart(part: string): { field: string; rawValue: string } {
    let firstOpIndex = -1;
    let foundOp = '';

    for (const op of RsqlStringParser.OPERATORS) {
      const index = part.indexOf(op);
      if (index !== -1 && (firstOpIndex === -1 || index < firstOpIndex)) {
        firstOpIndex = index;
        foundOp = op;
      }
    }

    if (firstOpIndex === -1) {
      return { field: '', rawValue: '' };
    }

    let field = part.substring(0, firstOpIndex).trim();
    const rawValue = part.substring(firstOpIndex).trim();

    // Remove optional = separator before operators that don't start with =
    if (field.endsWith('=') && !foundOp.startsWith('=')) {
      field = field.substring(0, field.length - 1).trim();
    }

    return { field, rawValue };
  }
}
