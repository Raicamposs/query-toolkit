import { describe, expect, it } from 'vitest';
import { ClauseEquals } from './clause-equals';
import { ClauseGreaterThan } from './clause-greater-than';
import { ClauseLike } from './clause-like';
import { ClauseOr } from './clause-or';

describe('ClauseOr', () => {
  describe('build', () => {
    describe('multiple clauses', () => {
      it('should combine two clauses with OR', () => {
        const clause1 = new ClauseEquals('status', 'active');
        const clause2 = new ClauseEquals('status', 'pending');
        const orClause = new ClauseOr(clause1, clause2);

        expect(orClause.build()).toBe("(status = 'active' OR status = 'pending')");
      });

      it('should combine three clauses with OR', () => {
        const clause1 = new ClauseEquals('type', 'A');
        const clause2 = new ClauseEquals('type', 'B');
        const clause3 = new ClauseEquals('type', 'C');
        const orClause = new ClauseOr(clause1, clause2, clause3);

        expect(orClause.build()).toBe("(type = 'A' OR type = 'B' OR type = 'C')");
      });

      it('should combine different clause types', () => {
        const clause1 = new ClauseEquals('status', 'active');
        const clause2 = new ClauseGreaterThan('age', 18);
        const orClause = new ClauseOr(clause1, clause2);

        expect(orClause.build()).toBe("(status = 'active' OR age > 18)");
      });

      it('should handle LIKE clauses in OR', () => {
        const clause1 = new ClauseLike('name', 'John%');
        const clause2 = new ClauseLike('name', 'Jane%');
        const orClause = new ClauseOr(clause1, clause2);

        expect(orClause.build()).toBe("(name LIKE 'John%' OR name LIKE 'Jane%')");
      });
    });

    describe('addClause method', () => {
      it('should add clause dynamically', () => {
        const clause1 = new ClauseEquals('status', 'active');
        const orClause = new ClauseOr(clause1);

        const clause2 = new ClauseEquals('status', 'pending');
        orClause.addClause(clause2);

        expect(orClause.build()).toBe("(status = 'active' OR status = 'pending')");
      });

      it('should return the clause instance for chaining', () => {
        const clause1 = new ClauseEquals('status', 'active');
        const orClause = new ClauseOr(clause1);

        const result = orClause.addClause(new ClauseEquals('status', 'pending'));
        expect(result).toBe(orClause);
      });

      it('should allow multiple addClause calls', () => {
        const orClause = new ClauseOr();
        orClause
          .addClause(new ClauseEquals('type', 'A'))
          .addClause(new ClauseEquals('type', 'B'))
          .addClause(new ClauseEquals('type', 'C'));

        expect(orClause.build()).toBe("(type = 'A' OR type = 'B' OR type = 'C')");
      });
    });

    describe('filtering undefined clauses', () => {
      it('should filter out clauses that return undefined', () => {
        const clause1 = new ClauseEquals('status', 'active');
        const clause2 = new ClauseEquals('value', null as any); // Returns undefined
        const clause3 = new ClauseEquals('status', 'pending');
        const orClause = new ClauseOr(clause1, clause2, clause3);

        expect(orClause.build()).toBe("(status = 'active' OR status = 'pending')");
      });

      it('should return undefined when all clauses are undefined', () => {
        const clause1 = new ClauseEquals('value1', null as any);
        const clause2 = new ClauseEquals('value2', undefined as any);
        const orClause = new ClauseOr(clause1, clause2);

        expect(orClause.build()).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle single clause', () => {
        const clause = new ClauseEquals('status', 'active');
        const orClause = new ClauseOr(clause);

        expect(orClause.build()).toBe("(status = 'active')");
      });

      it('should return undefined for empty clause array', () => {
        const orClause = new ClauseOr();
        expect(orClause.build()).toBeUndefined();
      });

      it('should handle nested OR clauses', () => {
        const innerOr = new ClauseOr(new ClauseEquals('type', 'A'), new ClauseEquals('type', 'B'));
        const outerOr = new ClauseOr(innerOr, new ClauseEquals('status', 'active'));

        expect(outerOr.build()).toBe("((type = 'A' OR type = 'B') OR status = 'active')");
      });
    });
  });
});
