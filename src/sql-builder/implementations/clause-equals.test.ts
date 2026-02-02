import { describe, expect, it } from 'vitest';
import { ClauseEquals } from './clause-equals';

describe('ClauseEquals', () => {
  describe('build', () => {
    describe('string values', () => {
      it('should generate equals clause for string', () => {
        const clause = new ClauseEquals('name', 'John');
        expect(clause.build()).toBe("name = 'John'");
      });

      it('should handle string with quotes', () => {
        const clause = new ClauseEquals('name', "O'Brien");
        expect(clause.build()).toBe("name = 'O''Brien'");
      });

      it('should handle empty string', () => {
        const clause = new ClauseEquals('name', '');
        expect(clause.build()).toBe("name = ''");
      });
    });

    describe('number values', () => {
      it('should generate equals clause for positive number', () => {
        const clause = new ClauseEquals('age', 25);
        expect(clause.build()).toBe('age = 25');
      });

      it('should generate equals clause for negative number', () => {
        const clause = new ClauseEquals('balance', -100);
        expect(clause.build()).toBe('balance = -100');
      });

      it('should generate equals clause for zero', () => {
        const clause = new ClauseEquals('count', 0);
        expect(clause.build()).toBe('count = 0');
      });

      it('should generate equals clause for decimal', () => {
        const clause = new ClauseEquals('price', 19.99);
        expect(clause.build()).toBe('price = 19.99');
      });
    });

    describe('boolean values', () => {
      it('should generate equals clause for true', () => {
        const clause = new ClauseEquals('active', true);
        expect(clause.build()).toBe('active = true');
      });

      it('should generate equals clause for false', () => {
        const clause = new ClauseEquals('active', false);
        expect(clause.build()).toBe('active = false');
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseEquals('name', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseEquals('name', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseEquals('', 'value')).toThrow('Field is required');
      });

      it('should throw error for null field', () => {
        expect(() => new ClauseEquals(null as any, 'value')).toThrow('Field is required');
      });

      it('should throw error for undefined field', () => {
        expect(() => new ClauseEquals(undefined as any, 'value')).toThrow('Field is required');
      });
    });
  });
});
