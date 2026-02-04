import { describe, expect, it } from 'vitest';
import { ClauseNotIn } from './clause-not-in';

describe('ClauseNotIn', () => {
  it('should build SQL with NOT IN operator', () => {
    const clause = new ClauseNotIn('status', ['active', 'pending']);
    expect(clause.build()).toBe("NOT status IN ('active', 'pending')");
  });

  it('should throw error if field is empty', () => {
    expect(() => new ClauseNotIn('', ['active'])).toThrow('Field is required');
  });

  it('should return undefined if no values', () => {
    const clause = new ClauseNotIn('status', []);
    expect(clause.build()).toBeUndefined();
  });
});
