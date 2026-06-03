export interface Logger {
  warn(message: string): void;
}

export interface DetectorConfig {
  /**
   * Se verdadeiro, `detectAndWarn` lança um erro em vez de registrar um aviso.
   * Padrão: false
   */
  strictMode: boolean;
  /**
   * Logger customizado opcional para delegar os avisos.
   */
  logger?: Logger;
}

// Padrões SQL perigosos para detecção
const DANGEROUS_PATTERNS = [
  /(^|\s)--/, // Comentário SQL (exige início de linha ou espaço antes)
  /\/\*/, // Início de comentário multi-linha
  /\*\//, // Fim de comentário multi-linha
  /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)/i, // Comandos perigosos após ponto-e-vírgula
  /UNION\s+(ALL\s+)?SELECT/i, // Injeção UNION
  /\b(OR|AND)\s+(['"]?\w+['"]?)\s*(=|!=|<>)\s*\2/i, // Injeção booleana com lados idênticos (ex: OR 1=1, AND 'a'='a')
  /\b(OR|AND)\s+(TRUE|FALSE|1\s*=\s*1|0\s*=\s*1)\b/i, // Variações booleanas comuns
  /\b(WAITFOR\s+DELAY|SLEEP|BENCHMARK)\b/i, // Injeção baseada em tempo
];

/**
 * Detecta padrões de SQL Injection em valores de string.
 *
 * Prefira a instanciação para configuração isolada por módulo (ex: strictMode por ambiente):
 *   const detector = new SqlInjectionDetector({ strictMode: true });
 *
 * Os métodos estáticos (detect, detectAndWarn, configure) delegam para uma instância
 * padrão compartilhada e são mantidos por compatibilidade.
 */
export class SqlInjectionDetector {
  private readonly config: DetectorConfig;

  constructor(config: Partial<DetectorConfig> = {}) {
    this.config = { strictMode: false, ...config };
  }

  /**
   * Retorna `true` se um padrão SQL perigoso for encontrado no valor.
   */
  detect(value: string): boolean {
    return DANGEROUS_PATTERNS.some((pattern) => pattern.test(value));
  }

  /**
   * Detecta e registra um aviso (ou lança erro no strictMode) se um padrão perigoso for encontrado.
   */
  detectAndWarn(value: string): void {
    if (!this.detect(value)) return;

    const preview = value.length > 50 ? `${value.substring(0, 50)}...` : value;
    const message = `[SQL Security Warning] Potentially dangerous pattern detected in value: "${preview}"`;

    if (this.config.strictMode) {
      throw new Error(message);
    }

    if (this.config.logger) {
      this.config.logger.warn(message);
    } else {
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  }

  // ─── API estática de conveniência (instância padrão compartilhada) ──────────

  private static _instance = new SqlInjectionDetector();

  /**
   * Configura a instância padrão compartilhada usada pelos métodos estáticos.
   * @param config - Configuração parcial a ser mesclada com a configuração atual.
   */
  static configure(config: Partial<DetectorConfig>): void {
    SqlInjectionDetector._instance = new SqlInjectionDetector({
      ...SqlInjectionDetector._instance.config,
      ...config,
    });
  }

  /** @see SqlInjectionDetector#detect */
  static detect(value: string): boolean {
    return SqlInjectionDetector._instance.detect(value);
  }

  /** @see SqlInjectionDetector#detectAndWarn */
  static detectAndWarn(value: string): void {
    SqlInjectionDetector._instance.detectAndWarn(value);
  }
}
