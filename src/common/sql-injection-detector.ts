/**
 * SQL Injection Detector
 *
 * Provides defense-in-depth security by detecting potentially dangerous
 * SQL patterns in user input. This is a supplementary security measure;
 * the primary protection comes from proper escaping in PrimitiveValue.
 *
 * This class logs warnings but does not block queries, as legitimate
 * data might contain these patterns.
 */
export class SqlInjectionDetector {
  // Dangerous SQL patterns for detection
  private static readonly DANGEROUS_PATTERNS = [
    /--/, // SQL comment
    /\/\*/, // Multi-line comment start
    /\*\//, // Multi-line comment end
    /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)/i, // Dangerous commands after semicolon
    /UNION\s+SELECT/i, // UNION injection
    /OR\s+1\s*=\s*1/i, // Classic OR injection
    /AND\s+1\s*=\s*1/i, // Classic AND injection
  ];

  /**
   * Detects potentially dangerous SQL patterns in a string
   *
   * @param value - String to check for SQL injection patterns
   * @returns true if dangerous pattern detected, false otherwise
   */
  static detect(value: string): boolean {
    for (const pattern of SqlInjectionDetector.DANGEROUS_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detects and logs warning if dangerous patterns are found
   *
   * @param value - String to check
   */
  static detectAndWarn(value: string): void {
    if (SqlInjectionDetector.detect(value)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[SQL Security Warning] Potentially dangerous pattern detected in value: "${value.substring(0, 50)}..."`
      );
    }
  }
}
