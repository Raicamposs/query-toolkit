import { PrimitiveValueType } from '../../common/types/primitive-value';

/**
 * @typeParam T - The type of the input value
 * @param value - The value to transform
 * @returns The transformed value
 */
export type TransformFunction = <T>(value: T) => PrimitiveValueType;
