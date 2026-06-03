# 🛡️ Segurança, Limites & Boas Práticas

A segurança de dados é um pilar fundamental do `@raicampos/query-toolkit`. A biblioteca implementa proteções ativas e passivas contra **SQL Injection** e exaustão de recursos.

---

## 1. 🛡️ Prevenção contra SQL Injection

### Camada A: Queries Parametrizadas (Defesa Ativa)

O `SqlBuilder` e o `ClauseVisitor` isolam completamente a instrução SQL dos valores usando placeholders indexados (`$1`, `$2`, …). O banco compila o plano de execução antes de injetar os valores, garantindo que qualquer input seja tratado como dado — nunca como comando.

```typescript
const { sql, params } = builder.build();
await db.query(sql, params); // SEGURO — valores nunca se misturam com o SQL
```

### Camada B: `SqlInjectionDetector` (Redundância Estática)

Analisador de assinaturas que inspeciona strings antes do processamento, detectando padrões como:

- `UNION SELECT …`
- Comentários SQL: `--` ou `/* */`
- Tautologias: `' OR '1'='1`
- Comandos empilhados: `; DROP TABLE`, `; UPDATE`, `; DELETE`
- Injeções temporais: `WAITFOR DELAY`, `SLEEP()`

#### Uso estático (comportamento padrão compartilhado)

```typescript
import { SqlInjectionDetector } from '@raicampos/query-toolkit';

// Apenas detecta (retorna boolean)
SqlInjectionDetector.detect("' OR 1=1"); // true

// Detecta e avisa (console.warn por padrão)
SqlInjectionDetector.detectAndWarn(userInput);

// Modo estrito: lança Error em vez de logar
SqlInjectionDetector.configure({ strictMode: true });
```

#### Uso por instância (configuração isolada por módulo)

Para isolar a configuração entre módulos diferentes — por exemplo, modo estrito em produção e permissivo em testes — instancie diretamente:

```typescript
const strictDetector = new SqlInjectionDetector({ strictMode: true });
const loggingDetector = new SqlInjectionDetector({
  strictMode: false,
  logger: myLogger, // substitui console.warn
});

strictDetector.detectAndWarn(value);   // lança Error
loggingDetector.detectAndWarn(value);  // delega ao logger customizado
```

---

## 2. 🚦 Limites contra Exaustão de Recursos

Consultas dinâmicas sem restrições podem derrubar bancos em produção. O `SqlBuilder` possui limites configuráveis:

```typescript
import { SqlBuilder } from '@raicampos/query-toolkit';

const builder = new SqlBuilder('users', undefined, {
  maxWhereClauses: 30,   // máximo de condições WHERE aninhadas
  maxOrderByClauses: 5,  // máximo de colunas para ordenação simultânea
  maxLimit: 100,         // limite máximo de linhas por consulta
});
```

Se qualquer limite for ultrapassado, uma exceção explícita é lançada (**Fail-Fast**) antes de onerar o banco.

---

## 💡 Melhores Práticas

1. **Use sempre queries parametrizadas**: nunca concatene `params` diretamente no SQL em produção — passe `sql` e `params` separados para o driver do banco.
2. **Valide inputs nas APIs**: use `QueryParamsParse.validate()` antes de processar filtros recebidos da URL.
3. **Prefira instâncias de `SqlInjectionDetector` em ambientes isolados**: o método estático `configure()` altera o estado global — em aplicações com múltiplos módulos, prefira `new SqlInjectionDetector({ ... })`.
4. **Limite o tamanho da URL**: configure middlewares (Fastify, Express, NestJS) para rejeitar payloads acima de 2048 caracteres.
