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
        expect(builder.build()).toBe("SELECT * FROM users WHERE (status = 'active')");
      });

      it('should handle number equals', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereEquals('age', 25);
        expect(builder.build()).toBe('SELECT * FROM users WHERE (age = 25)');
      });
    });

    describe('whereNotEquals', () => {
      it('should add not equals filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereNotEquals('status', 'deleted');
        expect(builder.build()).toBe("SELECT * FROM users WHERE (status <> 'deleted')");
      });
    });

    describe('whereLike', () => {
      it('should add like filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereLike('name', 'John%');
        expect(builder.build()).toBe("SELECT * FROM users WHERE (name LIKE 'John%')");
      });
    });

    describe('whereILike', () => {
      it('should add ilike filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereILike('name', 'john%');
        expect(builder.build()).toBe("SELECT * FROM users WHERE (name ILIKE 'john%')");
      });
    });

    describe('whereIn', () => {
      it('should add in filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereIn('status', ['active', 'pending']);
        expect(builder.build()).toBe("SELECT * FROM users WHERE (status IN ('active', 'pending'))");
      });
    });

    describe('whereBetween', () => {
      it('should add between filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereBetween('age', 18, 30);
        expect(builder.build()).toBe('SELECT * FROM users WHERE (age BETWEEN 18 AND 30)');
      });
    });

    describe('operators', () => {
      it('should handle greater than', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereGreaterThan('age', 18);
        expect(builder.build()).toBe('SELECT * FROM users WHERE (age > 18)');
      });

      it('should handle greater than or equals', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereGreaterThanOrEquals('age', 18);
        expect(builder.build()).toBe('SELECT * FROM users WHERE (age >= 18)');
      });

      it('should handle less than', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereLessThan('age', 30);
        expect(builder.build()).toBe('SELECT * FROM users WHERE (age < 30)');
      });

      it('should handle less than or equals', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereLessThanOrEquals('age', 30);
        expect(builder.build()).toBe('SELECT * FROM users WHERE (age <= 30)');
      });

      it('should handle array contains', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereArrayContains('tags', ['javascript']);
        expect(builder.build()).toContain('tags');
        expect(builder.build()).toContain('<@');
      });
    });

    describe('exists', () => {
      it('should handle whereExists', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereExists('SELECT 1 FROM profiles WHERE profiles.id = users.id');
        expect(builder.build()).toContain('EXISTS (SELECT 1 FROM profiles');
      });

      it('should handle whereNotExists', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereNotExists('SELECT 1 FROM profiles WHERE profiles.id = users.id');
        expect(builder.build()).toContain('NOT EXISTS (SELECT 1 FROM profiles');
      });
    });

    describe('whereRaw', () => {
      it('should add raw where clause', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereRaw('active = true');
        expect(builder.build()).toBe('SELECT * FROM users WHERE active = true');
      });

      it('should ignore empty raw clause', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereRaw('');
        expect(builder.build()).toBe('SELECT * FROM users');
      });
    });

    describe('whereClause and andFilter', () => {
      it('should add clause instance', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereClause(new ClauseEquals('status', 'active'));
        expect(builder.build()).toBe("SELECT * FROM users WHERE (status = 'active')");
      });
    });

    describe('orFilter', () => {
      it('should combine clauses with OR', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.orFilter(
          new ClauseEquals('status', 'active'),
          new ClauseEquals('status', 'pending')
        );
        expect(builder.build()).toBe("SELECT * FROM users WHERE ((status = 'active' OR status = 'pending'))");
      });
    });
  });

  describe('order by', () => {
    it('should add order by field', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOrder('asc', 'name');
      expect(builder.build()).toBe('SELECT * FROM users ORDER BY name asc');
    });

    it('should allow chaining different orders', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOrder('desc', 'created_at').addOrder('asc', 'name');
      expect(builder.build()).toBe('SELECT * FROM users ORDER BY created_at desc, name asc');
    });

    it('should throw RangeError when exceeding MAX_ORDER_BY_CLAUSES', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      // Limit is 10. Let's add 11 fields.
      expect(() => {
        builder.addOrder(
          'asc',
          'name', 'age', 'id', 'status', 'created_at',
          'email', 'active', 'tags', 'id', 'name', 'age'
        );
      }).toThrow(RangeError);
    });
  });

  describe('group by', () => {
    it('should add single group by field', () => {
      const builder = new SqlBuilder<TestTable>('SELECT id, COUNT(*) FROM users');
      builder.addGroup('id');
      expect(builder.build()).toBe('SELECT id, COUNT(*) FROM users GROUP BY id');
    });

    it('should add multiple group by fields', () => {
      const builder = new SqlBuilder<TestTable>('SELECT status, age, COUNT(*) FROM users');
      builder.addGroup('status', 'age');
      expect(builder.build()).toBe('SELECT status, age, COUNT(*) FROM users GROUP BY status, age');
    });

    it('should throw RangeError when exceeding MAX_GROUP_BY_CLAUSES', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      // Limit is 10.
      expect(() => {
        builder.addGroup(
          'name', 'age', 'id', 'status', 'created_at',
          'active', 'email', 'tags', 'id', 'name', 'age'
        );
      }).toThrow(RangeError);
    });
  });

  describe('limit and offset', () => {
    it('should add limit', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addLimit(10);
      expect(builder.build()).toBe('SELECT * FROM users LIMIT 10');
    });

    it('should add offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOffset(5);
      expect(builder.build()).toBe('SELECT * FROM users OFFSET 5');
    });

    it('should add both limit and offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addLimit(10).addOffset(5);
      expect(builder.build()).toBe('SELECT * FROM users LIMIT 10 OFFSET 5');
    });

    it('should ignore zero limit', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addLimit(0);
      expect(builder.build()).toBe('SELECT * FROM users');
    });

    it('should throw RangeError for negative limit', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      expect(() => builder.addLimit(-1)).toThrow(RangeError);
    });

    it('should throw TypeError for non-integer limit', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      expect(() => builder.addLimit(1.5)).toThrow(TypeError);
    });

    it('should throw RangeError for exceeding MAX_LIMIT', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      expect(() => builder.addLimit(2000)).toThrow(RangeError);
    });

    it('should ignore zero offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOffset(0);
      expect(builder.build()).toBe('SELECT * FROM users');
    });

    it('should throw RangeError for negative offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      expect(() => builder.addOffset(-1)).toThrow(RangeError);
    });

    it('should throw TypeError for non-integer offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      expect(() => builder.addOffset(1.5)).toThrow(TypeError);
    });
  });

  describe('static from()', () => {
    it('should create a new instance with base SQL', () => {
      const builder = SqlBuilder.from<TestTable>('users');
      expect(builder).toBeInstanceOf(SqlBuilder);
      expect(builder.build()).toBe('SELECT * FROM users');
    });
  });

  describe('column mapping', () => {
    it('should map field names using columnMapping', () => {
      const columnMapping = {
        id: 'user_id',
        name: 'user_name',
      };
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users', columnMapping);
      builder.whereEquals('id', 1).whereEquals('name', 'raian');

      const sql = builder.build();
      expect(sql).toContain('user_id = 1');
      expect(sql).toContain("user_name = 'raian'");
    });

    it('should use MapperBuilder generated mapper (simulated)', () => {
      const columnMapping = {
        id: 'user_id',
        name: 'user_name',
      };
      const builder = new SqlBuilder<any>('SELECT * FROM users', columnMapping);
      builder.whereEquals('id', 1).whereLike('name', 'A%');

      const sql = builder.build();
      expect(sql).toBe("SELECT * FROM users WHERE (user_id = 1) AND (user_name LIKE 'A%')");
    });
  });

  describe('debug methods', () => {
    it('should return string representation via toString()', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereEquals('status', 'active');
      const debug = builder.toString();
      expect(debug).toContain('SqlBuilder');
      expect(debug).toContain("status = 'active'");
    });

    it('should return JSON representation via toJSON()', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereEquals('status', 'active').addLimit(10);
      const json = builder.toJSON();
      expect(json.base).toBe('SELECT * FROM users');
      expect(json.limit).toBe(10);
      expect(json.sql).toContain('LIMIT 10');
    });
  });

  describe('clone()', () => {
    it('should return a new instance with same state', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder
        .whereEquals('status', 'active')
        .addOrder('asc', 'name')
        .addGroup('age')
        .addLimit(10)
        .addOffset(5);

      const cloned = builder.clone();
      expect(cloned).not.toBe(builder);
      expect(cloned.build()).toBe(builder.build());
      expect(cloned.toJSON()).toEqual(builder.toJSON());
    });
    describe('configurable limits', () => {
      it('should allow overriding maxWhereClauses', () => {
        const config = { maxWhereClauses: 2 };
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users', undefined, config);
        builder.whereEquals('id', 1).whereEquals('status', 'active');

        expect(() => builder.whereEquals('age', 25)).toThrow(RangeError);
      });

      it('should allow overriding maxOrderByClauses', () => {
        const config = { maxOrderByClauses: 1 };
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users', undefined, config);
        builder.addOrder('asc', 'name');

        expect(() => builder.addOrder('desc', 'age')).toThrow(RangeError);
      });

      it('should allow overriding maxGroupByClauses', () => {
        const config = { maxGroupByClauses: 1 };
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users', undefined, config);
        builder.addGroup('status');

        expect(() => builder.addGroup('age')).toThrow(RangeError);
      });

      it('should allow overriding maxLimit', () => {
        const config = { maxLimit: 50 };
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users', undefined, config);

        expect(() => builder.addLimit(51)).toThrow(RangeError);
        builder.addLimit(50); // Should pass
        expect(builder.build()).toContain('LIMIT 50');
      });

      it('should preserve config in clone()', () => {
        const config = { maxLimit: 5 };
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users', undefined, config);
        const cloned = builder.clone();

        expect(() => cloned.addLimit(6)).toThrow(RangeError);
      });
    });
  });
});
