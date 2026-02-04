import { describe, expect, it } from 'vitest';
import { parseRsqlValue } from './date-parser';

describe('date-parser', () => {
  it('should parse numbers', () => {
    expect(parseRsqlValue('123')).toBe(123);
    expect(parseRsqlValue('123.45')).toBe(123.45);
    expect(parseRsqlValue('-123')).toBe(-123);
  });

  it('should parse dates', () => {
    const dateStr = '2024-01-01';
    const parsed = parseRsqlValue(dateStr);
    expect(parsed).toBeInstanceOf(Date);
    expect((parsed as Date).getUTCFullYear()).toBe(2024);
  });

  it('should return raw value for invalid dates matching regex', () => {
    // A date-looking string that Zod might fail to parse (though z.coerce.date is quite liberal)
    // Coercing an extremely large date might throw or return invalid date
    const invalidDate = '9999-99-99';
    expect(parseRsqlValue(invalidDate)).toBe(invalidDate);
  });

  it('should return raw value for non-numeric/non-date strings', () => {
    expect(parseRsqlValue('not-a-value')).toBe('not-a-value');
  });

  it('should return null/undefined as is', () => {
    expect(parseRsqlValue(null as any)).toBe(null);
    expect(parseRsqlValue(undefined as any)).toBe(undefined);
  });
});
