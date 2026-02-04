import { describe, expect, it } from 'vitest';
import { DateParamSchema } from './date-params';

describe('Date Param Schema', () => {
  it('should return date', () => {
    const value = new Date(Date.now());

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual({
      equals: value,
    });
  });

  it('should return equals date', () => {
    const value = {
      equals: new Date(Date.now()),
    };

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return not equals date', () => {
    const value = {
      notEquals: new Date(Date.now()),
    };

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return date Gt', () => {
    const value = {
      gt: new Date(Date.now()),
    };

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return date Gte', () => {
    const value = {
      gte: new Date(Date.now()),
    };

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return date Lt', () => {
    const value = {
      lt: new Date(Date.now()),
    };

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return date Lte', () => {
    const value = {
      lte: new Date(Date.now()),
    };

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return in values date', () => {
    const value = {
      in: [new Date(Date.now())],
    };

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return not in values date', () => {
    const value = {
      notIn: [new Date(Date.now())],
    };

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return values two operators dates', () => {
    const value = {
      gte: new Date(Date.now()),
      lte: new Date(Date.now()),
    };

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return values when passing multiple operators [equals, notEquals, in, notIn]', () => {
    const value = {
      equals: new Date(Date.now()),
      notEquals: new Date(Date.now()),
      in: [new Date(Date.now())],
      notIn: [new Date(Date.now())],
    };

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return values when passing multiple operators [gt, gte, lt, lte]', () => {
    const value = {
      gt: new Date(Date.now()),
      gte: new Date(Date.now()),
      lt: new Date(Date.now()),
      lte: new Date(Date.now()),
    };

    const parsed = DateParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return a error invalid object', () => {
    const value = {
      any: 10,
    };
    expect(() => DateParamSchema.parse(value)).toThrowError();
  });

  it('should return a error invalid object', () => {
    const value = {
      any: 10,
      lte: new Date(Date.now()),
    };
    expect(() => DateParamSchema.parse(value)).toThrowError();
  });
});

import { CustomDateParamSchema, DateSchema } from './date-params';

describe('DateSchema', () => {
  it('should parse Flutter-style date strings', () => {
    const flutterDate = '2024-05-20 15:30:45.123';
    const parsed = DateSchema.parse(flutterDate);
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.getFullYear()).toBe(2024);
    expect(parsed.getMonth()).toBe(4); // Maio
    expect(parsed.getDate()).toBe(20);
  });

  it('should fail for invalid February date', () => {
    expect(() => DateSchema.parse('2024-02-30')).toThrow();
  });

  it('should parse standard ISO date string', () => {
    const isoDate = '2024-05-20T15:30:45.123Z';
    const parsed = DateSchema.parse(isoDate);
    expect(parsed.toISOString()).toBe(isoDate);
  });

  it('should fail for invalid February datetime', () => {
    expect(() => DateSchema.parse('2024-02-30T10:00:00')).toThrow();
  });

  it('should fail for date before 1900', () => {
    expect(() => DateSchema.parse('1899-12-31')).toThrow();
  });
});

describe('CustomDateParamSchema', () => {
  it('should parse with gte and lte', () => {
    const value = {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-01-02'),
    };
    expect(CustomDateParamSchema.parse(value)).toEqual(value);
  });

  it('should parse with gt and lt', () => {
    const value = {
      gt: new Date('2024-01-01'),
      lt: new Date('2024-01-02'),
    };
    expect(CustomDateParamSchema.parse(value)).toEqual(value);
  });

  it('should fail if start is greater than end', () => {
    const value = {
      gte: new Date('2024-01-02'),
      lte: new Date('2024-01-01'),
    };
    expect(() => CustomDateParamSchema.parse(value)).toThrow();
  });

  it('should fail if missing start or end', () => {
    expect(() => CustomDateParamSchema.parse({ gte: new Date() })).toThrow();
    expect(() => CustomDateParamSchema.parse({ lte: new Date() })).toThrow();
    expect(() => CustomDateParamSchema.parse({})).toThrow();
  });

  it('should handle gt and lte combination', () => {
    const value = {
      gt: new Date('2024-01-01'),
      lte: new Date('2024-01-02'),
    };
    expect(CustomDateParamSchema.parse(value)).toEqual(value);
  });

  it('should handle gte and lt combination', () => {
    const value = {
      gte: new Date('2024-01-01'),
      lt: new Date('2024-01-02'),
    };
    expect(CustomDateParamSchema.parse(value)).toEqual(value);
  });
});
