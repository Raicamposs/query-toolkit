import { describe, expect, it } from 'vitest';
import { ClauseNotILike } from './clause-not-ilike';

describe('ClauseNotILike', () => {
  it('should build SQL with NOT ILIKE operator', () => {
    const clause = new ClauseNotILike('name', 'John');
    expect(clause.build()).toBe("name NOT ILIKE 'John'");
  });
});
