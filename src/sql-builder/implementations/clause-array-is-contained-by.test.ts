import { describe, expect, it } from 'vitest';
import { ClauseArrayIsContainedBy } from './clause-array-is-contained-by';

describe('ClauseArrayIsContainedBy', () => {
  it('should build SQL with <@ operator', () => {
    const clause = new ClauseArrayIsContainedBy('tags', ['a', 'b']);
    expect(clause.build()).toBe("tags <@ ARRAY['a', 'b']");
  });

  it('should return undefined for empty array', () => {
    const clause = new ClauseArrayIsContainedBy('field', []);
    expect(clause.build()).toBeUndefined();
  });
});
