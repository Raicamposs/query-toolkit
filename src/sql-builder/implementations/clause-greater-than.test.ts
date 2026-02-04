import { describe, expect, it } from 'vitest';
import { ClauseGreaterThan } from './clause-greater-than';

describe('ClauseGreaterThan', () => {
  describe('build', () => {
    describe('number values', () => {
      it('should generate greater than clause for positive number', () => {
        const clause = new ClauseGreaterThan('age', 25);
        expect(clause.build()).toBe('age > 25');
      });

      it('should generate greater than clause for negative number', () => {
        const clause = new ClauseGreaterThan('temperature', -10);
        expect(clause.build()).toBe('temperature > -10');
      });

      it('should generate greater than clause for zero', () => {
        const clause = new ClauseGreaterThan('balance', 0);
        expect(clause.build()).toBe('balance > 0');
      });

      it('should generate greater than clause for decimal', () => {
        const clause = new ClauseGreaterThan('price', 19.99);
        expect(clause.build()).toBe('price > 19.99');
      });
    });

    describe('date values', () => {
      it('should generate greater than clause for date', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const clause = new ClauseGreaterThan('created_at', date);
        expect(clause.build()).toBe("created_at > '2024-01-15'");
      });

      it('should handle date at year boundary', () => {
        const date = new Date('2024-12-31T23:59:59Z');
        const clause = new ClauseGreaterThan('created_at', date);
        expect(clause.build()).toBe("created_at > '2024-12-31'");
      });
    });

    describe('invalid types', () => {
      it('should return undefined for string value', () => {
        const clause = new ClauseGreaterThan('field', 'invalid' as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for boolean value', () => {
        const clause = new ClauseGreaterThan('field', true as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseGreaterThan('age', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseGreaterThan('age', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseGreaterThan('', 25)).toThrow('Field is required');
      });
    });
  });
});
