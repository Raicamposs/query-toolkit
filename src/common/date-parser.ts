import { isNullOrUndefined } from '@raicamposs/toolkit';
import { z } from 'zod';
import { DateRsqlRegex } from './date-regex';

/**
 * Centralized utility for parsing RSQL date strings
 */
export function parseRsqlDate(value: string): string | Date {
  if (isNullOrUndefined(value)) return value;

  if (DateRsqlRegex.test(value)) {
    try {
      return z.coerce.date().parse(value);
    } catch {
      return value;
    }
  }

  return value;
}
