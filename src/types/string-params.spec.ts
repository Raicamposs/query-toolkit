import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { StringParamSchema } from './string-params';

describe('StringParamSchema', () => {
  it('should return string', () => {
    const value = 'BISNAGUINHA';

    const parsed = StringParamSchema.parse(value);
    expect(parsed).toStrictEqual({
      equals: 'BISNAGUINHA',
    });
  });

  it('should return contains object', () => {
    const value = {
      contains: 'BISNAGUINHA',
    };

    const parsed = StringParamSchema.parse(value);
    expect(parsed).toStrictEqual(value);
  });

  it('should return equals object', () => {
    const value = {
      equals: 'BISNAGUINHA',
    };

    const parsed = StringParamSchema.parse(value);
    expect(parsed).toStrictEqual(value);
  });

  it('should return contains object', () => {
    const value = {
      notEquals: 'BISNAGUINHA',
    };

    const parsed = StringParamSchema.parse(value);
    expect(parsed).toStrictEqual(value);
  });

  it('should return contains object', () => {
    const value = {
      notContains: 'BISNAGUINHA',
    };

    const parsed = StringParamSchema.parse(value);
    expect(parsed).toStrictEqual(value);
  });

  it('should return in object', () => {
    const value = {
      in: ['BISNAGUINHA'],
    };

    const parsed = StringParamSchema.parse(value);
    expect(parsed).toStrictEqual(value);
  });

  it('should return notIn object', () => {
    const value = {
      notIn: ['BISNAGUINHA'],
    };

    const parsed = StringParamSchema.parse(value);
    expect(parsed).toStrictEqual(value);
  });

  it('should return a error', () => {
    const value = {
      any: 'BISNAGUINHA',
    };
    try {
      StringParamSchema.parse(value);
    } catch (error) {
      expect(error).instanceOf(ZodError);
    }
  });

  it('should return a object with many values', () => {
    const value = {
      notIn: ['BISNAGUINHA'],
      notContains: 'BISNAGUINHA',
      contains: 'BISNAGUINHA',
    };

    const parsed = StringParamSchema.parse(value);
    expect(parsed).toStrictEqual(value);
  });
});
