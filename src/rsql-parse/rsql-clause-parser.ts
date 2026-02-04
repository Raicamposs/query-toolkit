import { Clause } from '../sql-builder/core/clause';
import { ClauseCondition } from '../sql-builder/implementations/clause-condition';
import { ClauseOr } from '../sql-builder/implementations/clause-or';
import { QueryableFields } from '../types';
import { QueryParamsOperatorFactory } from './query-params-operator-factory';

/**
 * Advanced RSQL parser that converts a standard RSQL string into a Clause tree.
 * Supports nested groups: (f1==v1;f2==v2),f3==v3
 */
export class RsqlClauseParser<T = any> {
  private static readonly OPERATORS = [
    '==', '!=', '~=', '!~=', 'in=', 'out=', 'btw=', 'gt=', 'gte=', 'lt=', 'lte=', '<@', '@>', '&&'
  ];

  constructor(private readonly tableMapper?: Partial<Record<QueryableFields<T>, string>>) { }

  parse(filter: string): Clause | undefined {
    if (!filter || filter.trim() === '') return undefined;
    return this.parseExpression(filter.trim());
  }

  private parseExpression(text: string): Clause {
    const parts = this.splitIgnoringGroups(text, ',');
    if (parts.length > 1) {
      return new ClauseOr(...parts.map(p => this.parseTerm(p)));
    }
    return this.parseTerm(text);
  }

  private parseTerm(text: string): Clause {
    const parts = this.splitIgnoringGroups(text, ';');
    if (parts.length > 1) {
      return new ClauseAnd(...parts.map(p => this.parseFactor(p)));
    }
    return this.parseFactor(text);
  }

  private parseFactor(text: string): Clause {
    text = text.trim();
    if (text.startsWith('(') && text.endsWith(')')) {
      return this.parseExpression(text.substring(1, text.length - 1));
    }
    return this.parseCondition(text);
  }

  private parseCondition(text: string): Clause {
    let firstOpIndex = -1;
    let foundOp = '';

    for (const op of RsqlClauseParser.OPERATORS) {
      const index = text.indexOf(op);
      if (index !== -1 && (firstOpIndex === -1 || index < firstOpIndex)) {
        firstOpIndex = index;
        foundOp = op;
      }
    }

    if (firstOpIndex === -1) {
      throw new Error(`Invalid RSQL condition: ${text}`);
    }

    let field = text.substring(0, firstOpIndex).trim();
    const rawValue = text.substring(firstOpIndex).trim();

    if (field.endsWith('=') && !foundOp.startsWith('=')) {
      field = field.substring(0, field.length - 1).trim();
    }

    // Map field name if mapper is provided
    const fieldName = field as keyof TableMapper<T>;
    if (this.tableMapper && (this.tableMapper as any)[fieldName]) {
      field = (this.tableMapper as any)[fieldName];
    }

    const operator = new QueryParamsOperatorFactory(rawValue).build();
    // Return a ClauseCondition that encapsulates the operator
    return new ClauseCondition(field, operator.query() as any);
  }

  private splitIgnoringGroups(text: string, separator: string): string[] {
    const parts: string[] = [];
    let currentPart = '';
    let depth = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '(') depth++;
      else if (char === ')') depth--;

      if (depth === 0 && char === separator) {
        parts.push(currentPart.trim());
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart.trim());
    return parts;
  }
}

type TableMapper<T> = Partial<Record<QueryableFields<T>, string>>;

/**
 * Internal class to handle ANDed clauses
 */
class ClauseAnd extends Clause {
  private clauses: Clause[];
  constructor(...clauses: Clause[]) {
    super();
    this.clauses = clauses;
  }
  build(): string | undefined {
    const built = this.clauses.map(c => c.build()).filter(b => !!b);
    if (built.length === 0) return undefined;
    return built.length === 1 ? built[0] : `(${built.join(' AND ')})`;
  }
}
