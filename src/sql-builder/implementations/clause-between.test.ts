import { describe, expect, it } from 'vitest';
import { ClauseBetween } from './clause-between';

describe('ClauseBetween', () => {
  describe('build', () => {
    describe('number ranges', () => {
      it('should generate BETWEEN clause for number range', () => {
        const clause = new ClauseBetween('age', 18, 65);
        expect(clause.build()).toBe('age BETWEEN 18 AND 65');
      });

      it('should handle negative numbers', () => {
        const clause = new ClauseBetween('temperature', -10, 30);
        expect(clause.build()).toBe('temperature BETWEEN -10 AND 30');
      });

      it('should handle decimal numbers', () => {
        const clause = new ClauseBetween('price', 9.99, 99.99);
        expect(clause.build()).toBe('price BETWEEN 9.99 AND 99.99');
      });

      it('should handle same start and end values', () => {
        const clause = new ClauseBetween('value', 5, 5);
        expect(clause.build()).toBe('value BETWEEN 5 AND 5');
      });
    });

    describe('date ranges', () => {
      it('should generate BETWEEN clause for date range', () => {
        const start = new Date('2024-01-01T00:00:00Z');
        const end = new Date('2024-12-31T23:59:59Z');
        const clause = new ClauseBetween('created_at', start, end);
        expect(clause.build()).toBe("created_at BETWEEN '01/01/2024' AND '31/12/2024'");
      });

      it('should handle same date for start and end', () => {
        const date = new Date('2024-06-15T12:00:00Z');
        const clause = new ClauseBetween('event_date', date, date);
        expect(clause.build()).toBe("event_date BETWEEN '15/06/2024' AND '15/06/2024'");
      });
    });

    describe('string ranges', () => {
      it('should generate BETWEEN clause for string range', () => {
        const clause = new ClauseBetween('name', 'A', 'M');
        expect(clause.build()).toBe("name BETWEEN 'A' AND 'M'");
      });

      it('should handle strings with quotes', () => {
        const clause = new ClauseBetween('name', "A'", "Z'");
        expect(clause.build()).toBe("name BETWEEN 'A''' AND 'Z'''");
      });
    });

    describe('null and undefined', () => {
      it('should return undefined when start is null', () => {
        const clause = new ClauseBetween('age', null as any, 65);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined when end is null', () => {
        const clause = new ClauseBetween('age', 18, null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined when both are null', () => {
        const clause = new ClauseBetween('age', null as any, null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined when start is undefined', () => {
        const clause = new ClauseBetween('age', undefined as any, 65);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined when end is undefined', () => {
        const clause = new ClauseBetween('age', 18, undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseBetween('', 1, 10)).toThrow('Field is required');
      });

      it('should throw error for null field', () => {
        expect(() => new ClauseBetween(null as any, 1, 10)).toThrow('Field is required');
      });

      it('should throw error for undefined field', () => {
        expect(() => new ClauseBetween(undefined as any, 1, 10)).toThrow('Field is required');
      });
    });
  });
});
