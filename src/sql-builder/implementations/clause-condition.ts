import { isEmpty, isNullOrUndefined } from '@raicamposs/toolkit';
import { Clause } from '../core/clause';
import { PrimitiveArrayValue } from '../core/primitive-array-value';
import { PrimitiveValue } from '../core/primitive-value';
import { TransformFunction } from '../core/transform-function';

export type Condition = {
  [key: string]: string | number | Date | boolean | Array<string | number | Date | boolean>;
};

export class ClauseCondition extends Clause {
  constructor(
    private readonly field: string,
    private readonly condition: Condition,
    private readonly transformFunction?: TransformFunction
  ) {
    super();
  }

  build() {
    if (isNullOrUndefined(this.field) || isNullOrUndefined(this.condition)) return undefined;

    if (!(this.condition instanceof Object)) {
      const value = new PrimitiveValue(this.condition, this.transformFunction).toSql();
      return this.transform('equals', value);
    }

    if (this.condition instanceof Date) {
      const value = new PrimitiveValue(this.condition, this.transformFunction).toSql();
      return this.transform('equals', value);
    }

    const output = Object.keys(this.condition)
      .map((filter) => {
        const conditionValue = this.condition[filter];
        let value: string | undefined;

        if (Array.isArray(conditionValue)) {
          value = new PrimitiveArrayValue(conditionValue, this.transformFunction).toSql();
        } else {
          value = new PrimitiveValue(conditionValue, this.transformFunction).toSql();
        }

        return this.transform(filter, value);
      })
      .filter((value) => !isEmpty(value))
      .map((value) => `(${value})`)
      .join(' and ');

    if (isEmpty(output)) return undefined;
    return output;
  }

  private transform(filter: string, value: string | undefined) {
    if (isNullOrUndefined(value)) return undefined;

    switch (filter) {
      case 'equals':
        return `${this.field} = ${value}`;

      case 'notEquals':
        return `${this.field} <> ${value}`;

      case 'notContains': {
        if (isNaN(+value)) {
          return `not ${this.field} ilike ${value}`;
        }
        return `not ${this.field} ilike '${value}'`;
      }

      case 'contains': {
        if (isNaN(+value)) {
          return `${this.field} ilike ${value}`;
        }
        return `${this.field} ilike '${value}'`;
      }

      case 'in':
        return `${this.field} in (${value})`;

      case 'notIn':
        return `not ${this.field} in (${value})`;

      case 'gt':
        return `${this.field} > ${value}`;

      case 'gte':
        return `${this.field} >= ${value}`;

      case 'lt':
        return `${this.field} < ${value}`;

      case 'lte':
        return `${this.field} <= ${value}`;

      case 'arrayContains':
        return this.buildWhereArray(this.field, value, '@>');

      case 'arrayIsContainedBy':
        return this.buildWhereArray(this.field, value, '<@');

      case 'arrayOverlap':
        return this.buildWhereArray(this.field, value, '&&');

      default:
        return `${this.field} = ${value}`;
    }
  }

  private buildWhereArray(field: string, value: string, operador: string) {
    return `
      CASE
        WHEN 
          pg_typeof(${field})::text = 'text' or
          pg_typeof(${field})::text = 'varchar' 
        THEN string_to_array(${field}::text, ',') ${operador} ARRAY [ ${value} ]
        ELSE ${field}::text[] ${operador} ARRAY [ ${value} ]
      END
    `.trim();
  }
}
