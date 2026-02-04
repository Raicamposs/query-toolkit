import { describe, expect, it } from 'vitest';
import { RsqlStringParser } from './rsql-string-parser';

describe('RsqlStringParser', () => {
  it('should parse simple equality', () => {
    const parser = new RsqlStringParser('name==John');
    expect(parser.parse()).toEqual({ name: '==John' });
  });

  it('should parse multiple filters with AND (;)', () => {
    const parser = new RsqlStringParser('name==John;age=gt=18');
    expect(parser.parse()).toEqual({
      name: '==John',
      age: 'gt=18'
    });
  });

  it('should handle repeated fields by converting to array', () => {
    const parser = new RsqlStringParser('tag==v1;tag==v2;tag==v3');
    const result: any = parser.parse();
    expect(result.tag).toEqual(['==v1', '==v2', '==v3']);
  });

  it('should skip parts without operators', () => {
    const parser = new RsqlStringParser('name==John;invalid_part');
    const result: any = parser.parse();
    expect(result.name).toBe('==John');
    expect(result.invalid_part).toBeUndefined();
  });

  it('should parse multiple filters with OR (,)', () => {
    const parser = new RsqlStringParser('status==ACTIVE,status==PENDING');
    expect(parser.parse()).toEqual({
      status: ['==ACTIVE', '==PENDING']
    });
  });

  it('should parse complex operators', () => {
    const parser = new RsqlStringParser('tags=@>tag1,tag2;price=btw=10,100');
    expect(parser.parse()).toEqual({
      tags: '@>tag1,tag2',
      price: 'btw=10,100'
    });
  });

  it('should handle empty or undefined input', () => {
    expect(new RsqlStringParser('').parse()).toEqual({});
  });

  it('should handle spaces around operators and separators', () => {
    const parser = new RsqlStringParser(' name == John ; age =gt= 18 ');
    expect(parser.parse()).toEqual({
      name: '== John',
      age: 'gt= 18'
    });
  });
});
