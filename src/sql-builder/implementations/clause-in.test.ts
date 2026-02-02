import { describe, expect, it } from 'vitest';
import { ClauseIn } from './clause-in';

describe('ClauseIn', () => {
  describe('build', () => {
    describe('string arrays', () => {
      it('should generate IN clause for string array', () => {
        const clause = new ClauseIn('status', ['active', 'pending', 'completed']);
        expect(clause.build()).toBe("status IN ('active', 'pending', 'completed')");
      });

      it('should handle single string value', () => {
        const clause = new ClauseIn('status', ['active']);
        expect(clause.build()).toBe("status IN ('active')");
      });

      it('should escape quotes in strings', () => {
        const clause = new ClauseIn('name', ["O'Brien", "D'Angelo"]);
        expect(clause.build()).toBe("name IN ('O''Brien', 'D''Angelo')");
      });
    });

    describe('number arrays', () => {
      it('should generate IN clause for number array', () => {
        const clause = new ClauseIn('id', [1, 2, 3, 4, 5]);
        expect(clause.build()).toBe('id IN (1, 2, 3, 4, 5)');
      });

      it('should handle single number value', () => {
        const clause = new ClauseIn('id', [42]);
        expect(clause.build()).toBe('id IN (42)');
      });

      it('should handle negative numbers', () => {
        const clause = new ClauseIn('value', [-1, 0, 1]);
        expect(clause.build()).toBe('value IN (-1, 0, 1)');
      });
    });

    describe('mixed type arrays', () => {
      it('should handle mixed string and number array', () => {
        const clause = new ClauseIn('value', [1, 'test', 2] as any);
        expect(clause.build()).toBe("value IN (1, 'test', 2)");
      });
    });

    describe('empty and null handling', () => {
      it('should return undefined for empty array', () => {
        const clause = new ClauseIn('status', []);
        expect(clause.build()).toBeUndefined();
      });

      it('should filter out null values', () => {
        const clause = new ClauseIn('id', [1, null, 2, null, 3] as any);
        expect(clause.build()).toBe('id IN (1, 2, 3)');
      });

      it('should filter out undefined values', () => {
        const clause = new ClauseIn('id', [1, undefined, 2, undefined, 3] as any);
        expect(clause.build()).toBe('id IN (1, 2, 3)');
      });

      it('should return undefined for array with only null/undefined', () => {
        const clause = new ClauseIn('id', [null, undefined] as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseIn('', [1, 2, 3])).toThrow('Field is required');
      });

      it('should throw error for null field', () => {
        expect(() => new ClauseIn(null as any, [1, 2, 3])).toThrow('Field is required');
      });

      it('should throw error for undefined field', () => {
        expect(() => new ClauseIn(undefined as any, [1, 2, 3])).toThrow('Field is required');
      });
    });
  });
});
