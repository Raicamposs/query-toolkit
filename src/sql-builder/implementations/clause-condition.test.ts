import { roundABNT } from '@raicamposs/toolkit';
import { describe, expect, it } from 'vitest';
import { ClauseCondition } from './clause-condition';

describe('ClauseCondition', () => {
  describe('build', () => {
    describe('equals condition', () => {
      it('should generate equals clause from condition object', () => {
        const clause = new ClauseCondition('status', { equals: 'active' });
        expect(clause.build()).toBe("(status = 'active')");
      });

      it('should handle number equals', () => {
        const clause = new ClauseCondition('age', { equals: 25 });
        expect(clause.build()).toBe('(age = 25)');
      });

      it('should handle boolean equals', () => {
        const clause = new ClauseCondition('active', { equals: true });
        expect(clause.build()).toBe('(active = true)');
      });

      it('should handle date equals', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const clause = new ClauseCondition('created_at', { equals: date });
        expect(clause.build()).toBe("(created_at = '15/01/2024')");
      });
    });

    describe('notEquals condition', () => {
      it('should generate not equals clause', () => {
        const clause = new ClauseCondition('status', { notEquals: 'inactive' });
        expect(clause.build()).toBe("(status <> 'inactive')");
      });

      it('should handle number not equals', () => {
        const clause = new ClauseCondition('age', { notEquals: 0 });
        expect(clause.build()).toBe('(age <> 0)');
      });
    });

    describe('comparison conditions', () => {
      it('should generate greater than clause', () => {
        const clause = new ClauseCondition('age', { gt: 18 });
        expect(clause.build()).toBe('(age > 18)');
      });

      it('should generate greater than or equals clause', () => {
        const clause = new ClauseCondition('age', { gte: 18 });
        expect(clause.build()).toBe('(age >= 18)');
      });

      it('should generate less than clause', () => {
        const clause = new ClauseCondition('age', { lt: 65 });
        expect(clause.build()).toBe('(age < 65)');
      });

      it('should generate less than or equals clause', () => {
        const clause = new ClauseCondition('age', { lte: 65 });
        expect(clause.build()).toBe('(age <= 65)');
      });
    });

    describe('contains conditions', () => {
      it('should generate contains clause for string', () => {
        const clause = new ClauseCondition('name', { contains: 'John' });
        expect(clause.build()).toBe("(name ilike 'John')");
      });

      it('should generate contains clause for number', () => {
        const clause = new ClauseCondition('code', { contains: 123 });
        expect(clause.build()).toBe("(code ilike '123')");
      });

      it('should generate notContains clause for string', () => {
        const clause = new ClauseCondition('name', { notContains: 'test' });
        expect(clause.build()).toBe("(not name ilike 'test')");
      });

      it('should generate notContains clause for number', () => {
        const clause = new ClauseCondition('code', { notContains: 456 });
        expect(clause.build()).toBe("(not code ilike '456')");
      });
    });

    describe('in and notIn conditions', () => {
      it('should generate IN clause', () => {
        const clause = new ClauseCondition('status', { in: ['active', 'pending', 'completed'] });
        expect(clause.build()).toBe("(status in ('active', 'pending', 'completed'))");
      });

      it('should generate NOT IN clause', () => {
        const clause = new ClauseCondition('status', { notIn: ['deleted', 'archived'] });
        expect(clause.build()).toBe("(not status in ('deleted', 'archived'))");
      });

      it('should handle number arrays in IN', () => {
        const clause = new ClauseCondition('id', { in: [1, 2, 3] });
        expect(clause.build()).toBe('(id in (1, 2, 3))');
      });
    });

    describe('array conditions', () => {
      it('should generate arrayContains clause', () => {
        const clause = new ClauseCondition('tags', { arrayContains: ['javascript', 'typescript'] });
        const result = clause.build();
        expect(result).toContain('CASE');
        expect(result).toContain('@>');
        expect(result).toContain("'javascript', 'typescript'");
      });

      it('should generate arrayIsContainedBy clause', () => {
        const clause = new ClauseCondition('tags', { arrayIsContainedBy: ['all', 'tags'] });
        const result = clause.build();
        expect(result).toContain('CASE');
        expect(result).toContain('<@');
        expect(result).toContain("'all', 'tags'");
      });

      it('should generate arrayOverlap clause', () => {
        const clause = new ClauseCondition('tags', { arrayOverlap: ['react', 'vue'] });
        const result = clause.build();
        expect(result).toContain('CASE');
        expect(result).toContain('&&');
        expect(result).toContain("'react', 'vue'");
      });
    });

    describe('multiple conditions', () => {
      it('should combine multiple conditions with AND', () => {
        const clause = new ClauseCondition('age', { gte: 18, lte: 65 });
        expect(clause.build()).toBe('(age >= 18) and (age <= 65)');
      });

      it('should combine different condition types', () => {
        const clause = new ClauseCondition('value', { gt: 0, notEquals: 100 });
        expect(clause.build()).toBe('(value > 0) and (value <> 100)');
      });

      it('should filter out undefined conditions', () => {
        const clause = new ClauseCondition('value', { equals: null as any, gt: 5 });
        expect(clause.build()).toBe('(value > 5)');
      });
    });

    describe('value transformation', () => {
      it('should apply transformation to single value', () => {
        const clause = new ClauseCondition('price', { equals: 100 }, (value) =>
          roundABNT((value as number) * 1.1, 2)
        );
        expect(clause.build()).toBe('(price = 110)');
      });

      it('should apply transformation to array values', () => {
        const clause = new ClauseCondition(
          'id',
          { in: [1, 2, 3] },
          (value) => (value as number) * 10
        );
        expect(clause.build()).toBe('(id in (10, 20, 30))');
      });
    });

    describe('direct value (non-object)', () => {
      it('should treat direct string value as equals', () => {
        const clause = new ClauseCondition('status', 'active' as any);
        expect(clause.build()).toBe("status = 'active'");
      });

      it('should treat direct number value as equals', () => {
        const clause = new ClauseCondition('age', 25 as any);
        expect(clause.build()).toBe('age = 25');
      });

      it('should treat direct boolean value as equals', () => {
        const clause = new ClauseCondition('active', true as any);
        expect(clause.build()).toBe('active = true');
      });

      it('should treat Date object as equals', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const clause = new ClauseCondition('created_at', date as any);
        expect(clause.build()).toBe("created_at = '15/01/2024'");
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null field', () => {
        const clause = new ClauseCondition(null as any, { equals: 'value' });
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined field', () => {
        const clause = new ClauseCondition(undefined as any, { equals: 'value' });
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for null condition', () => {
        const clause = new ClauseCondition('field', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined condition', () => {
        const clause = new ClauseCondition('field', undefined as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined when all conditions are null', () => {
        const clause = new ClauseCondition('field', { equals: null as any, gt: null as any });
        expect(clause.build()).toBeUndefined();
      });
    });
  });
});
