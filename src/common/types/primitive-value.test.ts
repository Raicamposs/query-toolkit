import { describe, expect, it } from 'vitest';
import { PrimitiveValue } from './primitive-value';

describe('PrimitiveValue', () => {
  describe('static converter()', () => {
    it('should convert "true" to boolean true', () => {
      const pv = PrimitiveValue.converter('true');
      expect(pv.getValue()).toBe(true);
      expect(pv.isBoolean()).toBe(true);
    });

    it('should convert "false" to boolean false', () => {
      const pv = PrimitiveValue.converter('false');
      expect(pv.getValue()).toBe(false);
      expect(pv.isBoolean()).toBe(true);
    });

    it('should convert valid integers to number', () => {
      const pv = PrimitiveValue.converter('123');
      expect(pv.getValue()).toBe(123);
      expect(pv.isNumber()).toBe(true);
    });

    it('should convert valid floats to number', () => {
      const pv = PrimitiveValue.converter('123.45');
      expect(pv.getValue()).toBe(123.45);
      expect(pv.isNumber()).toBe(true);
    });

    it('should convert negative numbers', () => {
      const pv = PrimitiveValue.converter('-42.5');
      expect(pv.getValue()).toBe(-42.5);
      expect(pv.isNumber()).toBe(true);
    });

    it('should convert valid dates to Date object', () => {
      const pv = PrimitiveValue.converter('2024-01-01');
      expect(pv.isDate()).toBe(true);
      expect((pv.getValue() as Date).toISOString()).toContain('2024-01-01');
    });

    it('should fallback to string for unmatched patterns', () => {
      const pv = PrimitiveValue.converter('hello');
      expect(pv.getValue()).toBe('hello');
      expect(pv.isString()).toBe(true);
    });

    it('should handle null/undefined safely', () => {
      // @ts-expect-error testing invalid input
      const pv = PrimitiveValue.converter(null);
      expect(pv.getValue()).toBeNull();
    });
  });

  describe('static converterArray()', () => {
    it('should parse comma-separated values into PrimitiveValue instances', () => {
      const arr = PrimitiveValue.converterArray('1, true, hello, 2024-01-01');
      expect(arr).toHaveLength(4);
      expect(arr[0].getValue()).toBe(1);
      expect(arr[1].getValue()).toBe(true);
      expect(arr[2].getValue()).toBe('hello');
      expect(arr[3].isDate()).toBe(true);
    });

    it('should ignore empty strings in array', () => {
      const arr = PrimitiveValue.converterArray('1,,2,');
      expect(arr).toHaveLength(2);
      expect(arr[0].getValue()).toBe(1);
      expect(arr[1].getValue()).toBe(2);
    });
  });

  describe('static value() and values()', () => {
    it('value() should return the raw converted primitive', () => {
      expect(PrimitiveValue.value('123')).toBe(123);
      expect(PrimitiveValue.value('false')).toBe(false);
      expect(PrimitiveValue.value('test')).toBe('test');
    });

    it('values() should return array of raw converted primitives', () => {
      const vals = PrimitiveValue.values('1, 2, 3');
      expect(vals).toEqual([1, 2, 3]);
    });
  });

  describe('type guards and assertions', () => {
    it('should correctly identify and cast numbers', () => {
      const pv = new PrimitiveValue(42);
      expect(pv.isNumber()).toBe(true);
      expect(pv.asNumber()).toBe(42);
      expect(pv.asType('number')).toBe(42);

      // Should NO LONGER parse number from string if instantiated manually
      const pvStr = new PrimitiveValue('42');
      expect(pvStr.asNumber()).toBeNull();
    });

    it('should correctly identify and cast booleans', () => {
      const pv = new PrimitiveValue(true);
      expect(pv.isBoolean()).toBe(true);
      expect(pv.asBoolean()).toBe(true);
      expect(pv.asType('boolean')).toBe(true);
    });

    it('should correctly identify and cast strings', () => {
      const pv = new PrimitiveValue('test');
      expect(pv.isString()).toBe(true);
      expect(pv.asString()).toBe('test');
      expect(pv.asType('string')).toBe('test');
    });

    it('should correctly identify and cast dates', () => {
      const date = new Date('2024-01-01');
      const pv = new PrimitiveValue(date);
      expect(pv.isDate()).toBe(true);
      expect(pv.asDate()).toBe(date);
      expect(pv.asType('date')).toBe(date);

      // Should NO LONGER parse valid date strings if instantiated manually
      const pvStr = new PrimitiveValue('2024-01-01');
      expect(pvStr.isValidDate()).toBe(false);
      expect(pvStr.asDate()).toBeNull();
    });

    it('should safely return null for invalid casts', () => {
      const pv = new PrimitiveValue('hello');
      expect(pv.asNumber()).toBeNull();
      expect(pv.asBoolean()).toBeNull();
      expect(pv.asDate()).toBeNull();
      expect(pv.asType('number')).toBeNull();
    });
  });
});
