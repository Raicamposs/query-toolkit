import { describe, expect, it } from 'vitest';
import { ClauseNotEquals } from './clause-not-equals';

describe('ClauseNotEquals', () => {
  describe('build', () => {
    describe('string values', () => {
      it('should generate not equals clause for string', () => {
        const clause = new ClauseNotEquals('name', 'John');
        expect(clause.build()).toBe("name <> 'John'");
      });

      it('should handle string with quotes', () => {
        const clause = new ClauseNotEquals('name', "O'Brien");
        expect(clause.build()).toBe("name <> 'O''Brien'");
      });
    });

    describe('number values', () => {
      it('should generate not equals clause for number', () => {
        const clause = new ClauseNotEquals('age', 25);
        expect(clause.build()).toBe('age <> 25');
      });

      it('should handle zero', () => {
        const clause = new ClauseNotEquals('count', 0);
        expect(clause.build()).toBe('count <> 0');
      });
    });

    describe('boolean values', () => {
      it('should generate not equals clause for true', () => {
        const clause = new ClauseNotEquals('active', true);
        expect(clause.build()).toBe('active <> true');
      });

      it('should generate not equals clause for false', () => {
        const clause = new ClauseNotEquals('active', false);
        expect(clause.build()).toBe('active <> false');
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseNotEquals('name', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseNotEquals('name', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseNotEquals('', 'value')).toThrow('Field is required');
      });
    });
  });
});
