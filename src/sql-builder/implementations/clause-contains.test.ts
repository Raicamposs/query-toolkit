import { describe, expect, it } from 'vitest';
import { ClauseContains } from './clause-contains';

describe('ClauseContains', () => {
  describe('build', () => {
    describe('array containment operators', () => {
      it('should generate contains clause with default <@ operator', () => {
        const clause = new ClauseContains('tags', ['javascript', 'typescript']);
        expect(clause.build()).toBe("array[tags]::text[] <@ array['javascript','typescript']");
      });

      it('should generate contains clause with @> operator', () => {
        const clause = new ClauseContains('tags', ['react', 'vue'], '@>');
        expect(clause.build()).toBe("array[tags]::text[] @> array['react','vue']");
      });

      it('should generate contains clause with <@ operator explicitly', () => {
        const clause = new ClauseContains('categories', ['tech', 'news'], '<@');
        expect(clause.build()).toBe("array[categories]::text[] <@ array['tech','news']");
      });
    });

    describe('string arrays', () => {
      it('should handle single string value', () => {
        const clause = new ClauseContains('tags', ['single']);
        expect(clause.build()).toBe("array[tags]::text[] <@ array['single']");
      });

      it('should handle multiple string values', () => {
        const clause = new ClauseContains('tags', ['one', 'two', 'three']);
        expect(clause.build()).toBe("array[tags]::text[] <@ array['one','two','three']");
      });

      it('should escape quotes in strings', () => {
        const clause = new ClauseContains('tags', ["O'Brien", "D'Angelo"]);
        expect(clause.build()).toBe("array[tags]::text[] <@ array['O''Brien','D''Angelo']");
      });
    });

    describe('empty and null handling', () => {
      it('should return undefined for empty array', () => {
        const clause = new ClauseContains('tags', []);
        expect(clause.build()).toBeUndefined();
      });

      it('should filter out null values', () => {
        const clause = new ClauseContains('tags', ['valid', null as any, 'value']);
        expect(clause.build()).toBe("array[tags]::text[] <@ array['valid','value']");
      });

      it('should filter out undefined values', () => {
        const clause = new ClauseContains('tags', ['valid', undefined as any, 'value']);
        expect(clause.build()).toBe("array[tags]::text[] <@ array['valid','value']");
      });

      it('should return undefined for array with only null/undefined', () => {
        const clause = new ClauseContains('tags', [null, undefined] as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseContains('', ['value'])).toThrow('Field is required');
      });

      it('should throw error for null field', () => {
        expect(() => new ClauseContains(null as any, ['value'])).toThrow('Field is required');
      });

      it('should throw error for undefined field', () => {
        expect(() => new ClauseContains(undefined as any, ['value'])).toThrow('Field is required');
      });
    });
  });
});
