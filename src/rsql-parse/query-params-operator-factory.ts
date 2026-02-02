import {
  ArrayContainsOperator,
  ArrayIsContainedByOperator,
  ArrayOverlapOperator,
  BetweenOperator,
  ContainsOperator,
  EqualsOperator,
  GreaterThanOperator,
  GreaterThanOrEqualsOperator,
  InOperator,
  LessThanOperator,
  LessThanOrEqualOperator,
  NotContainsOperator,
  NotEqualsOperator,
  NotInOperator,
  QueryParamsOperator,
} from '../query-operator';
import { UnknownOperator } from '../query-operator/unknow-operator';

export class QueryParamsOperatorFactory {
  constructor(private readonly params: string) {}

  build(): QueryParamsOperator {
    switch (true) {
      case this.params.startsWith('=='):
        return new EqualsOperator(this.params);

      case this.params.startsWith('!='):
        return new NotEqualsOperator(this.params);

      case this.params.startsWith('~='):
        return new ContainsOperator(this.params);

      case this.params.startsWith('!~='):
        return new NotContainsOperator(this.params);

      case this.params.startsWith('in='):
        return new InOperator(this.params);

      case this.params.startsWith('out='):
        return new NotInOperator(this.params);

      case this.params.startsWith('btw='):
        return new BetweenOperator(this.params);

      case this.params.startsWith('gt='):
        return new GreaterThanOperator(this.params);

      case this.params.startsWith('gte='):
        return new GreaterThanOrEqualsOperator(this.params);

      case this.params.startsWith('lt='):
        return new LessThanOperator(this.params);

      case this.params.startsWith('lte='):
        return new LessThanOrEqualOperator(this.params);

      case this.params.startsWith('<@'):
        return new ArrayIsContainedByOperator(this.params);

      case this.params.startsWith('@>'):
        return new ArrayContainsOperator(this.params);

      case this.params.startsWith('&&'):
        return new ArrayOverlapOperator(this.params);

      default:
        return new UnknownOperator(this.params);
    }
  }
}

// Equality (==) : equals
// Inequality (!=) : not equals
// Ilike (~=) : ilike in sentence
// Ilike number string (+=) : ilike factor number in sentence
// NotLike (!~=) : not like in sentence
// In (in=) : in
// NotIn (out=) : notIn
// Greater than (gt=) : gt
// Greater than or equal to (gte) : gte
// Less than (lt=) : lt
// Less than or equal to (lte=) : lte
// Between (btw=) : btw
