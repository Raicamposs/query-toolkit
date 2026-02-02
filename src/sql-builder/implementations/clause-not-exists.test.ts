import { describe, expect, it } from 'vitest';
import { ClauseNotExists } from './clause-not-exists';

describe('ClauseNotExists', () => {
  describe('build', () => {
    it('should generate correct NOT EXISTS SQL for valid SELECT subquery', () => {
      const sql = 'SELECT 1 FROM users WHERE active = false';
      const clause = new ClauseNotExists(sql);
      const result = clause.build();

      expect(result).toBe(`NOT EXISTS (${sql})`);
    });

    it('should handle complex subqueries with NOT prefix', () => {
      const sql = "SELECT id FROM orders WHERE user_id = users.id AND status = 'cancelled'";
      const clause = new ClauseNotExists(sql);
      const result = clause.build();

      expect(result).toBe(`NOT EXISTS (${sql})`);
    });

    it('should trim whitespace from SQL', () => {
      const sql = '  SELECT 1 FROM inactive_users  ';
      const clause = new ClauseNotExists(sql);
      const result = clause.build();

      expect(result).toBe(`NOT EXISTS (${sql.trim()})`);
    });

    it('should return undefined for empty string', () => {
      const clause = new ClauseNotExists('');
      const result = clause.build();

      expect(result).toBeUndefined();
    });

    it('should return undefined for whitespace-only string', () => {
      const clause = new ClauseNotExists('   ');
      const result = clause.build();

      expect(result).toBeUndefined();
    });

    it('should throw error for SQL without SELECT', () => {
      const clause = new ClauseNotExists("INSERT INTO users VALUES (1, 'test')");

      expect(() => clause.build()).toThrow('EXISTS clause requires a SELECT subquery');
    });

    it('should throw error for non-SELECT statements', () => {
      const clause = new ClauseNotExists('CREATE TABLE test (id INT)');

      expect(() => clause.build()).toThrow('EXISTS clause requires a SELECT subquery');
    });

    it('should be case-insensitive for SELECT validation', () => {
      const clause = new ClauseNotExists('SeLeCt 1 from users');
      const result = clause.build();

      expect(result).toBe('NOT EXISTS (SeLeCt 1 from users)');
    });

    it('should detect SQL injection with comments', () => {
      const clause = new ClauseNotExists('SELECT 1 FROM users -- malicious comment');

      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should detect SQL injection with UNION', () => {
      const clause = new ClauseNotExists('SELECT 1 FROM users UNION SELECT * FROM passwords');

      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should detect SQL injection with OR 1=1', () => {
      const clause = new ClauseNotExists('SELECT 1 FROM users WHERE active = false OR 1=1');

      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should detect SQL injection with AND 1=1', () => {
      const clause = new ClauseNotExists('SELECT 1 FROM users WHERE id = 1 AND 1=1');

      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should detect SQL injection with multi-line comments', () => {
      const clause = new ClauseNotExists('SELECT 1 FROM users /* comment */');

      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should handle SELECT with WHERE clause', () => {
      const sql = 'SELECT id FROM deleted_users WHERE deleted_at IS NOT NULL';
      const clause = new ClauseNotExists(sql);
      const result = clause.build();

      expect(result).toBe(`NOT EXISTS (${sql})`);
    });

    it('should handle SELECT with multiple conditions', () => {
      const sql =
        "SELECT 1 FROM orders WHERE user_id = 123 AND status = 'pending' AND created_at < NOW()";
      const clause = new ClauseNotExists(sql);
      const result = clause.build();

      expect(result).toBe(`NOT EXISTS (${sql})`);
    });

    it('should handle SELECT with LEFT JOIN', () => {
      const sql =
        'SELECT u.id FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.id IS NULL';
      const clause = new ClauseNotExists(sql);
      const result = clause.build();

      expect(result).toBe(`NOT EXISTS (${sql})`);
    });
  });
});
