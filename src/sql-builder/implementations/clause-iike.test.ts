import { describe, expect, it } from 'vitest';
import { ClauseILike } from './clause-iike';

describe('ClauseILike', () => {
  describe('build', () => {
    describe('case-insensitive patterns', () => {
      it('should generate ILIKE clause for simple pattern', () => {
        const clause = new ClauseILike('name', 'john%');
        expect(clause.build()).toBe("name ILIKE 'john%'");
      });

      it('should handle wildcard at start', () => {
        const clause = new ClauseILike('email', '%@EXAMPLE.COM');
        expect(clause.build()).toBe("email ILIKE '%@EXAMPLE.COM'");
      });

      it('should handle wildcard in middle', () => {
        const clause = new ClauseILike('name', 'J%N');
        expect(clause.build()).toBe("name ILIKE 'J%N'");
      });

      it('should handle multiple wildcards', () => {
        const clause = new ClauseILike('description', '%TEST%VALUE%');
        expect(clause.build()).toBe("description ILIKE '%TEST%VALUE%'");
      });

      it('should escape quotes in pattern', () => {
        const clause = new ClauseILike('name', "o'%");
        expect(clause.build()).toBe("name ILIKE 'o''%'");
      });
    });

    describe('non-string values', () => {
      it('should return undefined for number value', () => {
        const clause = new ClauseILike('field', 123 as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for boolean value', () => {
        const clause = new ClauseILike('field', false as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for date value', () => {
        const clause = new ClauseILike('field', new Date() as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseILike('name', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseILike('name', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseILike('', 'pattern')).toThrow('Field is required');
      });
    });
  });
});
