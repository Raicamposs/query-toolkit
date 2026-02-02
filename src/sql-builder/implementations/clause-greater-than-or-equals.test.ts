import { describe, expect, it } from 'vitest';
import { ClauseGreaterThanOrEquals } from './clause-greater-than-or-equals';

describe('ClauseGreaterThanOrEquals', () => {
  describe('build', () => {
    describe('number values', () => {
      it('should generate greater than or equals clause for number', () => {
        const clause = new ClauseGreaterThanOrEquals('age', 18);
        expect(clause.build()).toBe('age >= 18');
      });

      it('should handle zero', () => {
        const clause = new ClauseGreaterThanOrEquals('balance', 0);
        expect(clause.build()).toBe('balance >= 0');
      });

      it('should handle negative numbers', () => {
        const clause = new ClauseGreaterThanOrEquals('temperature', -5);
        expect(clause.build()).toBe('temperature >= -5');
      });

      it('should handle decimal numbers', () => {
        const clause = new ClauseGreaterThanOrEquals('price', 9.99);
        expect(clause.build()).toBe('price >= 9.99');
      });
    });

    describe('date values', () => {
      it('should generate greater than or equals clause for date', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const clause = new ClauseGreaterThanOrEquals('created_at', date);
        expect(clause.build()).toBe("created_at >= '01/01/2024'");
      });

      it('should handle date boundaries', () => {
        const date = new Date('2024-12-31T23:59:59Z');
        const clause = new ClauseGreaterThanOrEquals('expires_at', date);
        expect(clause.build()).toBe("expires_at >= '31/12/2024'");
      });
    });

    describe('invalid types', () => {
      it('should return undefined for string value', () => {
        const clause = new ClauseGreaterThanOrEquals('field', 'invalid' as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for boolean value', () => {
        const clause = new ClauseGreaterThanOrEquals('field', true as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseGreaterThanOrEquals('age', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseGreaterThanOrEquals('age', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseGreaterThanOrEquals('', 18)).toThrow('Field is required');
      });
    });
  });
});
