import { describe, expect, it } from 'vitest';
import { ClauseEquals } from '../implementations/clause-equals';
import { SqlBuilder } from './sql-builder';

interface TestTable {
  id: number;
  name: string;
  email: string;
  age: number;
  status: string;
  created_at: Date;
  tags: string[];
  active: boolean;
}

describe('SqlBuilder', () => {
  describe('where clauses', () => {
    describe('whereEquals', () => {
      it('should add equals filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereEquals('status', 'active');
        expect(builder.build()).toBe("SELECT * FROM users where (status = 'active')");
      });

      it('should handle number equals', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereEquals('age', 25);
        expect(builder.build()).toBe('SELECT * FROM users where (age = 25)');
      });

      it('should handle boolean equals', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereEquals('active', true);
        expect(builder.build()).toBe('SELECT * FROM users where (active = true)');
      });
    });

    describe('whereNotEquals', () => {
      it('should add not equals filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereNotEquals('status', 'deleted');
        expect(builder.build()).toBe("SELECT * FROM users where (status <> 'deleted')");
      });
    });

    describe('whereLike', () => {
      it('should add LIKE filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereLike('name', 'John%');
        expect(builder.build()).toBe("SELECT * FROM users where (name LIKE 'John%')");
      });
    });

    describe('whereILike', () => {
      it('should add ILIKE filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereILike('email', '%@example.com');
        expect(builder.build()).toBe("SELECT * FROM users where (email ILIKE '%@example.com')");
      });
    });

    describe('whereIn', () => {
      it('should add IN filter for strings', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereIn('status', ['active', 'pending']);
        expect(builder.build()).toBe("SELECT * FROM users where (status IN ('active', 'pending'))");
      });

      it('should add IN filter for numbers', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereIn('id', [1, 2, 3]);
        expect(builder.build()).toBe('SELECT * FROM users where (id IN (1, 2, 3))');
      });
    });

    describe('whereBetween', () => {
      it('should add BETWEEN filter for numbers', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereBetween('age', 18, 65);
        expect(builder.build()).toBe('SELECT * FROM users where (age BETWEEN 18 AND 65)');
      });

      it('should add BETWEEN filter for dates', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        const start = new Date('2024-01-01T00:00:00Z');
        const end = new Date('2024-12-31T23:59:59Z');
        builder.whereBetween('created_at', start, end);
        expect(builder.build()).toBe(
          "SELECT * FROM users where (created_at BETWEEN '01/01/2024' AND '31/12/2024')"
        );
      });
    });

    describe('whereBetweenOperator', () => {
      it('should add BETWEEN filter using operator object', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereBetweenOperator('age', { gte: 18, lte: 65 });
        expect(builder.build()).toBe('SELECT * FROM users where (age BETWEEN 18 AND 65)');
      });
    });

    describe('whereGreaterThan', () => {
      it('should add greater than filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereGreaterThan('age', 18);
        expect(builder.build()).toBe('SELECT * FROM users where (age > 18)');
      });
    });

    describe('whereGreaterThanOrEquals', () => {
      it('should add greater than or equals filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereGreaterThanOrEquals('age', 18);
        expect(builder.build()).toBe('SELECT * FROM users where (age >= 18)');
      });
    });

    describe('whereLessThan', () => {
      it('should add less than filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereLessThan('age', 65);
        expect(builder.build()).toBe('SELECT * FROM users where (age < 65)');
      });
    });

    describe('whereLessThanOrEquals', () => {
      it('should add less than or equals filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereLessThanOrEquals('age', 65);
        expect(builder.build()).toBe('SELECT * FROM users where (age <= 65)');
      });
    });

    describe('whereArrayContains', () => {
      it('should add array contains filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereArrayContains('tags', ['javascript', 'typescript']);
        expect(builder.build()).toContain('array[tags]::text[]');
        expect(builder.build()).toContain('<@');
      });

      it('should handle @> containment', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereArrayContains('tags', ['react'], '@>');
        expect(builder.build()).toContain('@>');
      });
    });

    describe('whereExists', () => {
      it('should add EXISTS clause', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereExists('SELECT 1 FROM orders WHERE orders.user_id = users.id');
        expect(builder.build()).toBe(
          'SELECT * FROM users where (EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id))'
        );
      });
    });

    describe('whereNotExists', () => {
      it('should add NOT EXISTS clause', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereNotExists('SELECT 1 FROM orders WHERE orders.user_id = users.id');
        expect(builder.build()).toBe(
          'SELECT * FROM users where (NOT EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id))'
        );
      });
    });

    describe('whereCondition', () => {
      it('should add condition filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereCondition('age', { gte: 18, lte: 65 });
        expect(builder.build()).toBe('SELECT * FROM users where ((age >= 18) and (age <= 65))');
      });
    });

    describe('whereConditions', () => {
      it('should add multiple condition filters', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereConditions({
          age: { gte: 18 },
          status: { equals: 'active' },
        } as any);
        expect(builder.build()).toContain('age >= 18');
        expect(builder.build()).toContain("status = 'active'");
      });
    });

    describe('whereRaw', () => {
      it('should add raw SQL filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereRaw('custom_field IS NOT NULL');
        expect(builder.build()).toBe('SELECT * FROM users where custom_field IS NOT NULL');
      });

      it('should ignore empty raw SQL', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereRaw('');
        expect(builder.build()).toBe('SELECT * FROM users');
      });
    });

    describe('whereClause', () => {
      it('should add custom clause', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        const clause = new ClauseEquals('status', 'active');
        builder.whereClause(clause);
        expect(builder.build()).toBe("SELECT * FROM users where (status = 'active')");
      });
    });
  });

  describe('orFilter', () => {
    it('should combine clauses with OR', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.orFilter(new ClauseEquals('status', 'active'), new ClauseEquals('status', 'pending'));
      expect(builder.build()).toBe(
        "SELECT * FROM users where ((status = 'active' or status = 'pending'))"
      );
    });

    it('should work with other where clauses', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder
        .whereGreaterThan('age', 18)
        .orFilter(new ClauseEquals('status', 'active'), new ClauseEquals('status', 'pending'));
      expect(builder.build()).toContain('age > 18');
      expect(builder.build()).toContain("status = 'active' or status = 'pending'");
    });
  });

  describe('order by', () => {
    it('should add ascending order', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOrder('asc', 'name');
      expect(builder.build()).toBe('SELECT * FROM users order by name asc');
    });

    it('should add descending order', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOrder('desc', 'created_at');
      expect(builder.build()).toBe('SELECT * FROM users order by created_at desc');
    });

    it('should add multiple order fields', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOrder('asc', 'status', 'name');
      expect(builder.build()).toBe('SELECT * FROM users order by status asc, name asc');
    });

    it('should allow chaining different orders', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOrder('desc', 'created_at').addOrder('asc', 'name');
      expect(builder.build()).toBe('SELECT * FROM users order by created_at desc, name asc');
    });
  });

  describe('group by', () => {
    it('should add single group field', () => {
      const builder = new SqlBuilder<TestTable>('SELECT status, COUNT(*) FROM users');
      builder.addGroup('status');
      expect(builder.build()).toBe('SELECT status, COUNT(*) FROM users group by status');
    });

    it('should add multiple group fields', () => {
      const builder = new SqlBuilder<TestTable>('SELECT status, age, COUNT(*) FROM users');
      builder.addGroup('status', 'age');
      expect(builder.build()).toBe('SELECT status, age, COUNT(*) FROM users group by status, age');
    });
  });

  describe('limit and offset', () => {
    it('should add limit', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addLimit(10);
      expect(builder.build()).toBe('SELECT * FROM users limit 10');
    });

    it('should add offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOffset(20);
      expect(builder.build()).toBe('SELECT * FROM users offset 20');
    });

    it('should add both limit and offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addLimit(10).addOffset(20);
      expect(builder.build()).toBe('SELECT * FROM users limit 10 offset 20');
    });

    it('should ignore zero limit', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addLimit(0);
      expect(builder.build()).toBe('SELECT * FROM users');
    });

    it('should ignore zero offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOffset(0);
      expect(builder.build()).toBe('SELECT * FROM users');
    });
  });

  describe('buildWhere', () => {
    it('should return only where clause without WHERE keyword', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereEquals('status', 'active').whereGreaterThan('age', 18);
      expect(builder.buildWhere()).toBe("(status = 'active') and (age > 18)");
    });

    it('should return empty string when no where clauses', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      expect(builder.buildWhere()).toBe('');
    });
  });

  describe('complete SQL building', () => {
    it('should build SQL with all clauses', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder
        .whereEquals('status', 'active')
        .whereGreaterThan('age', 18)
        .addOrder('desc', 'created_at')
        .addLimit(10)
        .addOffset(20);

      const sql = builder.build();
      expect(sql).toContain("where (status = 'active') and (age > 18)");
      expect(sql).toContain('order by created_at desc');
      expect(sql).toContain('limit 10');
      expect(sql).toContain('offset 20');
    });

    it('should build SQL with group by and order', () => {
      const builder = new SqlBuilder<TestTable>('SELECT status, COUNT(*) FROM users');
      builder.whereGreaterThan('age', 18).addGroup('status').addOrder('desc', 'status');

      const sql = builder.build();
      expect(sql).toContain('where (age > 18)');
      expect(sql).toContain('group by status');
      expect(sql).toContain('order by status desc');
    });

    it('should normalize whitespace in final SQL', () => {
      const builder = new SqlBuilder<TestTable>('SELECT   *   FROM   users');
      builder.whereEquals('status', 'active');
      const sql = builder.build();
      expect(sql).not.toContain('  ');
      expect(sql).toBe("SELECT * FROM users where (status = 'active')");
    });
  });

  describe('method chaining', () => {
    it('should allow chaining all methods', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      const result = builder
        .whereEquals('status', 'active')
        .whereGreaterThan('age', 18)
        .whereLike('name', 'John%')
        .addOrder('desc', 'created_at')
        .addLimit(10)
        .addOffset(0);

      expect(result).toBe(builder);
      expect(builder.build()).toContain("status = 'active'");
      expect(builder.build()).toContain('age > 18');
      expect(builder.build()).toContain("name LIKE 'John%'");
    });
  });

  describe('multiple filters', () => {
    it('should combine multiple where clauses with AND', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereEquals('status', 'active').whereGreaterThan('age', 18).whereLessThan('age', 65);

      expect(builder.build()).toBe(
        "SELECT * FROM users where (status = 'active') and (age > 18) and (age < 65)"
      );
    });

    it('should handle mix of different clause types', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder
        .whereEquals('status', 'active')
        .whereLike('email', '%@example.com')
        .whereIn('id', [1, 2, 3])
        .whereGreaterThan('age', 18);

      const sql = builder.build();
      expect(sql).toContain("status = 'active'");
      expect(sql).toContain("email LIKE '%@example.com'");
      expect(sql).toContain('id IN (1, 2, 3)');
      expect(sql).toContain('age > 18');
    });
  });
});
