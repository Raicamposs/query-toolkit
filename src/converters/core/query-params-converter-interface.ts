export interface IQueryParamsConverter<TResult> {
  build(): Record<string, TResult>;
}
