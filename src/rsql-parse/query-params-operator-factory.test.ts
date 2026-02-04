import { describe, expect, it } from 'vitest';
import { ArrayContainsOperator, ArrayIsContainedByOperator, ArrayOverlapOperator, BetweenOperator, ContainsOperator, EqualsOperator, GreaterThanOperator, GreaterThanOrEqualsOperator, InOperator, LessThanOperator, LessThanOrEqualOperator, NotContainsOperator, NotEqualsOperator, NotInOperator } from '../query-operator';
import { UnknownOperator } from '../query-operator/unknown-operator';
import { QueryParamsOperatorFactory } from './query-params-operator-factory';

describe('QueryParamsOperatorFactory', () => {
  it('should create EqualsOperator for ==', () => {
    const factory = new QueryParamsOperatorFactory('==value');
    expect(factory.build()).toBeInstanceOf(EqualsOperator);
  });

  it('should create NotEqualsOperator for !=', () => {
    const factory = new QueryParamsOperatorFactory('!=value');
    expect(factory.build()).toBeInstanceOf(NotEqualsOperator);
  });

  it('should create ContainsOperator for ~=', () => {
    const factory = new QueryParamsOperatorFactory('~=value');
    expect(factory.build()).toBeInstanceOf(ContainsOperator);
  });

  it('should create NotContainsOperator for !~=', () => {
    const factory = new QueryParamsOperatorFactory('!~=value');
    expect(factory.build()).toBeInstanceOf(NotContainsOperator);
  });

  it('should create InOperator for in=', () => {
    const factory = new QueryParamsOperatorFactory('in=v1,v2');
    expect(factory.build()).toBeInstanceOf(InOperator);
  });

  it('should create NotInOperator for out=', () => {
    const factory = new QueryParamsOperatorFactory('out=v1,v2');
    expect(factory.build()).toBeInstanceOf(NotInOperator);
  });

  it('should create BetweenOperator for btw=', () => {
    const factory = new QueryParamsOperatorFactory('btw=1,10');
    expect(factory.build()).toBeInstanceOf(BetweenOperator);
  });

  it('should create GreaterThanOperator for gt=', () => {
    const factory = new QueryParamsOperatorFactory('gt=18');
    expect(factory.build()).toBeInstanceOf(GreaterThanOperator);
  });

  it('should create GreaterThanOrEqualsOperator for gte=', () => {
    const factory = new QueryParamsOperatorFactory('gte=18');
    expect(factory.build()).toBeInstanceOf(GreaterThanOrEqualsOperator);
  });

  it('should create LessThanOperator for lt=', () => {
    const factory = new QueryParamsOperatorFactory('lt=18');
    expect(factory.build()).toBeInstanceOf(LessThanOperator);
  });

  it('should create LessThanOrEqualOperator for lte=', () => {
    const factory = new QueryParamsOperatorFactory('lte=18');
    expect(factory.build()).toBeInstanceOf(LessThanOrEqualOperator);
  });

  it('should create ArrayIsContainedByOperator for <@', () => {
    const factory = new QueryParamsOperatorFactory('<@v1,v2');
    expect(factory.build()).toBeInstanceOf(ArrayIsContainedByOperator);
  });

  it('should create ArrayContainsOperator for @>', () => {
    const factory = new QueryParamsOperatorFactory('@>v1,v2');
    expect(factory.build()).toBeInstanceOf(ArrayContainsOperator);
  });

  it('should create ArrayOverlapOperator for &&', () => {
    const factory = new QueryParamsOperatorFactory('&&v1,v2');
    expect(factory.build()).toBeInstanceOf(ArrayOverlapOperator);
  });

  it('should create UnknownOperator for unknown symbols', () => {
    const factory = new QueryParamsOperatorFactory('unknown=value');
    expect(factory.build()).toBeInstanceOf(UnknownOperator);
  });
});
