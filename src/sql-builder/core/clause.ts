import { TransformFunction } from './transform-function';

export abstract class Clause {
  abstract build(): string | undefined;
  protected valueTransform: TransformFunction | undefined;

  withValueTransform(transform?: TransformFunction) {
    this.valueTransform = transform;
    return this;
  }
}
