import { PrimitiveValueTypes } from './primitive-value';

export type TransformFunction = <T>(value: T) => PrimitiveValueTypes;
