import { PrimitiveValueType } from './primitive-value';

export type EqualsCondition<T extends PrimitiveValueType> = {
  equals: T;
};

export type NotEqualsCondition<T extends PrimitiveValueType> = {
  notEquals: T;
};

export type ContainsCondition<T extends string = string> = {
  contains: T;
};

export type NotContainsCondition<T extends string = string> = {
  notContains: T;
};

export type InCondition<T extends PrimitiveValueType> = {
  in: T[];
};

export type NotInCondition<T extends PrimitiveValueType> = {
  notIn: T[];
};

export type GreaterThanCondition<T extends number | Date> = {
  gt: T;
};

export type GreaterThanOrEqualsCondition<T extends number | Date> = {
  gte: T;
};

export type LessThanCondition<T extends number | Date> = {
  lt: T;
};

export type LessThanOrEqualsCondition<T extends number | Date> = {
  lte: T;
};

export type BetweenCondition<T extends number | Date> = {
  gte: T;
  lte: T;
};

export type ArrayIsContainedByCondition = {
  arrayIsContainedBy: PrimitiveValueType[];
};

export type ArrayContainsCondition = {
  arrayContains: PrimitiveValueType[];
};

export type ArrayOverlapCondition = {
  arrayOverlap: PrimitiveValueType[];
};
