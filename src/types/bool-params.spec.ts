import { describe, expect, it } from 'vitest';
import { BoolParamSchema } from './bool-params';

describe('BoolParamSchema', () => {
  it('should return boolean', () => {
    const value = true;

    const parsed = BoolParamSchema.parse(value);
    expect(parsed).toEqual({
      equals: value,
    });
  });

  it('should return equals boolean', () => {
    const value = {
      equals: true,
    };

    const parsed = BoolParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return notEquals boolean', () => {
    const value = {
      notEquals: true,
    };

    const parsed = BoolParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return notIn object', () => {
    const value = {
      notIn: [true],
    };

    const parsed = BoolParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return in object', () => {
    const value = {
      in: [true],
    };

    const parsed = BoolParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return a object with many values', () => {
    const value = {
      in: [true],
      notIn: [false],
    };

    const parsed = BoolParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return a error with string', () => {
    const value = '123';
    expect(() => BoolParamSchema.parse(value)).toThrowError();
  });

  it('should return a error with number', () => {
    const value = 123;
    expect(() => BoolParamSchema.parse(value)).toThrowError();
  });

  it('should return a error', () => {
    const value = {
      any: 163,
    };
    expect(() => BoolParamSchema.parse(value)).toThrowError();
  });
});
