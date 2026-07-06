/**
 * Extrater keys of T that are queryable via RSQL.
 * Includes primitives, dates, and arrays of primitives.
 */
export type QueryableFields<T> = {
  [K in keyof T]: T[K] extends
    string | number | boolean | Date | string[] | number[] | boolean[] | Date[] | null | undefined
    ? K
    : never;
}[keyof T];

/**
 * Type-safe RSQL parameters for a given Entity.
 */
export type RsqlQueryParams<T> = Partial<Record<QueryableFields<T>, string | string[]>>;
