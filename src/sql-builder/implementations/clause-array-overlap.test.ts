import { describe, expect, it } from 'vitest';
import { ClauseArrayOverlap } from './clause-array-overlap';

describe('ClauseArrayOverlap', () => {
  it('should build SQL with && operator', () => {
    const clause = new ClauseArrayOverlap('tags', ['a', 'b']);
    expect(clause.build()).toBe("tags && ARRAY['a', 'b']");
  });

  it('should return undefined for empty array', () => {
    const clause = new ClauseArrayOverlap('field', []);
    expect(clause.build()).toBeUndefined();
  });
});
