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
