import { describe, expect, it } from 'vitest';
import { ClauseLessThan } from './clause-less-than';

describe('ClauseLessThan', () => {
  describe('build', () => {
    describe('number values', () => {
      it('should generate less than clause for positive number', () => {
        const clause = new ClauseLessThan('age', 65);
        expect(clause.build()).toBe('age < 65');
      });

      it('should generate less than clause for negative number', () => {
        const clause = new ClauseLessThan('temperature', 0);
        expect(clause.build()).toBe('temperature < 0');
      });

      it('should generate less than clause for decimal', () => {
        const clause = new ClauseLessThan('price', 99.99);
        expect(clause.build()).toBe('price < 99.99');
      });
    });

    describe('date values', () => {
      it('should generate less than clause for date', () => {
        const date = new Date('2024-12-31T23:59:59Z');
        const clause = new ClauseLessThan('expires_at', date);
        expect(clause.build()).toBe("expires_at < '31/12/2024'");
      });

      it('should handle date at start of year', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const clause = new ClauseLessThan('created_at', date);
        expect(clause.build()).toBe("created_at < '01/01/2024'");
      });
    });

    describe('invalid types', () => {
      it('should return undefined for string value', () => {
        const clause = new ClauseLessThan('field', 'invalid' as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for boolean value', () => {
        const clause = new ClauseLessThan('field', false as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseLessThan('age', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseLessThan('age', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseLessThan('', 25)).toThrow('Field is required');
      });
    });
  });
});
