import { describe, expect, it } from 'vitest';
import { ClauseArrayContains } from './clause-array-contains';

describe('ClauseArrayContains', () => {
  it('should build SQL with @> operator', () => {
    const clause = new ClauseArrayContains('tags', ['a', 'b']);
    expect(clause.build()).toBe("tags @> ARRAY['a', 'b']");
  });

  it('should return undefined for empty values', () => {
    const clause = new ClauseArrayContains('tags', []);
    expect(clause.build()).toBeUndefined();
  });
});
