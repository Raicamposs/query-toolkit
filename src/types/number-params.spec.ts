import { describe, expect, it } from 'vitest';
import { NumberParamSchema } from './number-params';

describe('NumberParamSchema', () => {
  it('should return serial number', () => {
    const value = 163;

    const parsed = NumberParamSchema.parse(value);
    expect(parsed).toEqual({
      equals: value,
    });
  });

  it('should return equals object', () => {
    const value = {
      equals: 163,
    };

    const parsed = NumberParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return notEquals object', () => {
    const value = {
      notEquals: 163,
    };

    const parsed = NumberParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return gt object', () => {
    const value = {
      gt: 163,
    };

    const parsed = NumberParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return gte object', () => {
    const value = {
      gte: 163,
    };

    const parsed = NumberParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return lt object', () => {
    const value = {
      lt: 163,
    };

    const parsed = NumberParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return lte object', () => {
    const value = {
      lte: 163,
    };

    const parsed = NumberParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return in object', () => {
    const value = {
      in: [163],
    };

    const parsed = NumberParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return notIn object', () => {
    const value = {
      notIn: [163],
    };

    const parsed = NumberParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return a error', () => {
    const value = {
      any: 163,
    };
    expect(() => NumberParamSchema.parse(value)).toThrowError();
  });

  it('should return a object with many values', () => {
    const value = {
      notIn: [163],
      lt: 163,
      gt: 163,
    };

    const parsed = NumberParamSchema.parse(value);
    expect(parsed).toEqual(value);
  });
});
