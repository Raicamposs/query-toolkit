// Equality (==) : equals
// Inequality (!=) : not equals
// Ilike (~=) : ilike in sentence
// Ilike number string (+=) : ilike factor number in sentence
// NotLike (!~=) : not like in sentence
// In (in=) : in
// NotIn (out=) : notIn
// Greater than (gt=) : gt
// Greater than or equal to (gte) : gte
// Less than (lt=) : lt
// Less than or equal to (lte=) : lte
// Between (btw=) : btw

import { Nullable, ValueOf } from '@raicamposs/toolkit';
import type { OperatorVisitor } from '../converters/operator-visitor';
import { PrimitiveValueTypes } from '../sql-builder/core';
import { RsqlCondition } from '../types';

export const OperatorSymbol = {
  equals: '==',
  notEquals: '!=',
  ilike: '~=',
  ilikeNumberString: '+=',
  notLike: '!~=',
  in: 'in=',
  notIn: 'out=',
  greaterThan: 'gt=',
  greaterThanOrEqual: 'gte=',
  lessThan: 'lt=',
  lessThanOrEqual: 'lte=',
  between: 'btw=',
} as const;

export type OperatorSymbolType = ValueOf<typeof OperatorSymbol>;

export abstract class QueryParamsOperator {
  constructor(
    public readonly symbol: string,
    public readonly params: string
  ) {}

  abstract value(): PrimitiveValueTypes | PrimitiveValueTypes[];
  abstract query(): Nullable<RsqlCondition>;

  /**
   * Accept a visitor to convert this operator to a specific format
   * @template T - The return type of the visitor
   * @param visitor - The visitor implementation
   * @param field - The field name this operator applies to
   */
  abstract accept<T>(visitor: OperatorVisitor<T>, field: string): T;

  /**
   * Helper to get the value part of the parameter string by removing the operator symbol.
   */
  protected getRawValue(): string {
    if (!this.params.includes(this.symbol)) {
      return this.params;
    }
    const [, value] = this.params.split(this.symbol);
    return value;
  }
}
