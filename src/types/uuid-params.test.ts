import { describe, expect, it } from 'vitest';
import { UuidParamSchema } from './uuid-params';

describe('UuidParamSchema', () => {
  it('should validate valid UUID', () => {
    const uuid = '550e8400-e29b-411d-a716-446655440000';
    const result = UuidParamSchema.safeParse({ equals: uuid });
    expect(result.success).toBe(true);
  });

  it('should invalidate invalid UUID', () => {
    const result = UuidParamSchema.safeParse({ equals: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('should validate in array of UUIDs', () => {
    const uuid1 = '550e8400-e29b-411d-a716-446655440000';
    const uuid2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    const result = UuidParamSchema.safeParse({ in: [uuid1, uuid2] });
    expect(result.success).toBe(true);
  });

  it('should invalidate empty in array', () => {
    const result = UuidParamSchema.safeParse({ in: [] });
    expect(result.success).toBe(false);
  });
});
