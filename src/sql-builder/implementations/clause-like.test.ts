import { describe, expect, it } from 'vitest';
import { ClauseLike } from './clause-like';

describe('ClauseLike', () => {
  describe('build', () => {
    describe('string patterns', () => {
      it('should generate LIKE clause for simple pattern', () => {
        const clause = new ClauseLike('name', 'John%');
        expect(clause.build()).toBe("name LIKE 'John%'");
      });

      it('should handle wildcard at start', () => {
        const clause = new ClauseLike('email', '%@example.com');
        expect(clause.build()).toBe("email LIKE '%@example.com'");
      });

      it('should handle wildcard in middle', () => {
        const clause = new ClauseLike('name', 'J%n');
        expect(clause.build()).toBe("name LIKE 'J%n'");
      });

      it('should handle multiple wildcards', () => {
        const clause = new ClauseLike('description', '%test%value%');
        expect(clause.build()).toBe("description LIKE '%test%value%'");
      });

      it('should handle underscore wildcard', () => {
        const clause = new ClauseLike('code', 'A_C');
        expect(clause.build()).toBe("code LIKE 'A_C'");
      });

      it('should escape quotes in pattern', () => {
        const clause = new ClauseLike('name', "O'%");
        expect(clause.build()).toBe("name LIKE 'O''%'");
      });
    });

    describe('non-string values', () => {
      it('should return undefined for number value', () => {
        const clause = new ClauseLike('field', 123 as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for boolean value', () => {
        const clause = new ClauseLike('field', true as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for date value', () => {
        const clause = new ClauseLike('field', new Date() as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseLike('name', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseLike('name', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseLike('', 'pattern')).toThrow('Field is required');
      });
    });
  });
});
