# 🔍 RSQL Parsing & Operadores Extensíveis

O módulo `rsql-parse` é responsável por interpretar strings de busca no padrão RSQL oriundas de query parameters na URL e transformá-las em um mapa estruturado e fortemente tipado de operadores lógicos de domínio (`QueryParamsOperator`).

---

## 📖 Sintaxe RSQL Suportada

| Operador RSQL | Significado | Exemplo de Uso | Expressão Equivalente |
|:---:|---|---|---|
| `==` | Igualdade | `name==John` | `name = 'John'` |
| `!=` | Diferença | `status!=DELETED` | `status != 'DELETED'` |
| `~=` | Contém (Busca Parcial) | `title~=clean` | `title ILIKE '%clean%'` |
| `!~=` | Não Contém | `title!~=draft` | `title NOT ILIKE '%draft%'` |
| `gt=` | Maior Que | `age=gt=18` | `age > 18` |
| `gte=` | Maior ou Igual | `age=gte=18` | `age >= 18` |
| `lt=` | Menor Que | `price=lt=100` | `price < 100` |
| `lte=` | Menor ou Igual | `price=lte=100` | `price <= 100` |
| `btw=` | Entre (Faixa de valores) | `salary=btw=5000,8000` | `salary BETWEEN 5000 AND 8000` |
| `in=` | Contido em Lista | `role=in=ADMIN,USER` | `role IN ('ADMIN', 'USER')` |
| `out=` | Não contido em Lista | `role=out=GUEST` | `role NOT IN ('GUEST')` |
| `@>` | Contém Array (Postgres) | `tags=@>typescript,node` | `tags @> ARRAY['typescript', 'node']` |
| `<@` | Está Contido no Array | `tags=<@typescript,node` | `tags <@ ARRAY['typescript', 'node']` |
| `&&` | Sobreposição de Array | `tags=&&javascript,html` | `tags && ARRAY['javascript', 'html']` |

---

## 🛠️ O Pipeline de Parsing Moderno

```mermaid
graph LR
    URL[URL Query String] -->|1. RsqlStringParser| RawMap[Raw Params: Record string, string]
    RawMap -->|2. QueryParamsParse| OpMap[Operators Map: Record string, QueryParamsOperator[]]
```

### 1. Parsing Sintático com `RsqlStringParser`

O `RsqlStringParser` analisa a string bruta da URL, interpretando os delimitadores lógicos `;` (AND) e `,` (OR) e extraindo um dicionário de pares chave-valor.

```typescript
import { RsqlStringParser } from '@raicampos/query-toolkit';

const rawFilter = 'status==ACTIVE;age=gt=18';
const rawParams = new RsqlStringParser(rawFilter).parse();
// {
//   status: '==ACTIVE',
//   age: 'gt=18'
// }
```

### 2. Resolução Semântica com `QueryParamsParse`

O `QueryParamsParse<T>` converte o dicionário em instâncias concretas de operadores. Aceita um schema opcional para restringir e validar os campos queryáveis.

```typescript
import { QueryParamsParse } from '@raicampos/query-toolkit';

interface UserFilter {
  status: string;
  age: number;
}

const rawParams = {
  status: '==ACTIVE',
  age: 'gt=18',
  password: '==secret', // será ignorado — não está no schema
};

const schema = { status: true, age: true } as const;

const { operators } = new QueryParamsParse<UserFilter>(rawParams, schema);
// {
//   status: [ EqualsOperator { symbol: '==', value: 'ACTIVE' } ],
//   age:    [ GreaterThanOperator { symbol: 'gt=', value: 18 } ]
// }
```

### 3. Validação com `validate()` e `validateOrThrow()`

Ambos os métodos verificam tipos e executam validadores customizados. A diferença é o comportamento em falha.

#### `validate()` — retorna resultado estruturado

Retorna `ValidationResult` com erros tipados por `field`, `message` e `code`.

```typescript
import { QueryParamsParse, ValidationResult, ValidationError } from '@raicampos/query-toolkit';

const parser = new QueryParamsParse<UserFilter>(rawParams, {
  age: {
    type: 'number',
    validate: (value) => value > 0 || 'Idade deve ser positiva',
  },
  status: 'string',
});

const result: ValidationResult = parser.validate();

if (!result.success) {
  result.errors.forEach((err: ValidationError) => {
    console.log(err.field);   // 'age'
    console.log(err.code);    // 'INVALID_TYPE' | 'SAFE_PARSE_FAILED' | 'CUSTOM_VALIDATION_FAILED' | 'INVALID_SORT_FIELD'
    console.log(err.message); // 'tipo esperado: number' | mensagem do validador
  });
}
```

#### `validateOrThrow()` — padrão Fail-Fast

Lança `ValidationException` se houver qualquer erro. Ideal para controllers onde dado inválido é uma exceção não recuperável.

```typescript
import { QueryParamsParse, ValidationException } from '@raicampos/query-toolkit';

try {
  parser.validateOrThrow();
  // continua somente se válido
} catch (e) {
  if (e instanceof ValidationException) {
    return reply.status(400).send({ details: e.errors });
  }
}
```

Ambos os métodos aceitam as mesmas três sobrecargas:

```typescript
// 1. Usa schema e validadores definidos no construtor
parser.validate();

// 2. Usa apenas validadores customizados (sem verificação de tipo)
parser.validate({ age: (value) => value > 0 || 'Deve ser positivo' });

// 3. Usa schema completo + validadores opcionais
parser.validate(
  { age: 'number', status: 'string' },
  { age: (value) => value <= 120 || 'Idade inválida' }
);
```

#### `FieldTypes` suportados no schema

```typescript
type FieldTypes =
  | 'string'  | 'number'  | 'boolean'  | 'date'
  | 'string[]'| 'number[]'| 'boolean[]'| 'date[]';
```

#### Validação automática de sort

Quando um schema está presente, campos de sort fora do schema são detectados automaticamente:

```typescript
const parser = new QueryParamsParse(
  { sort: 'senha:asc' },   // 'senha' não está no schema
  { nome: 'string' }
);

const { errors } = parser.validate();
// [{ field: 'senha', code: 'INVALID_SORT_FIELD', message: "ordenação pelo campo 'senha' não é permitida" }]
```

---

## 🔌 Extensibilidade via `OperatorRegistry` e `CustomQueryParamsOperator`

A biblioteca segue o **Princípio Aberto-Fechado (OCP)**: novos operadores são adicionados **sem modificar o core**.

### Criando um operador customizado

Estenda `CustomQueryParamsOperator` (não a base `QueryParamsOperator`). Isso garante que o operador seja roteado para `visitCustom()` nos visitors, em vez do fallback `visitUnknown()`.

```typescript
import {
  CustomQueryParamsOperator,
  QueryParamsOperatorSafeParse,
  OperatorRegistry,
} from '@raicampos/query-toolkit';
import { Nullable } from '@raicampos/toolkit';

type RegexCondition = { regex: string };

class RegexOperator extends CustomQueryParamsOperator<RegexCondition, string> {
  constructor(params: string) {
    super('regex=', params);
  }

  safeParse(): QueryParamsOperatorSafeParse<string> {
    const value = this.value();
    if (!value) return { success: false, error: 'Regex inválido' };
    return { success: true, value };
  }

  value(): Nullable<string> {
    return this.getRawValue() || null;
  }

  query(): Nullable<RegexCondition> {
    const value = this.value();
    return value ? { regex: value } : null;
  }
}

// Registro — a partir daqui todos os parsers reconhecem "regex="
OperatorRegistry.register('regex=', (params) => new RegexOperator(params));
```

### Roteando o operador no visitor com `BaseOperatorVisitor`

Visitors que estendem `BaseOperatorVisitor` ganham `visitCustom()` e o método `registerHandler()` para despachar por símbolo:

```typescript
import { BaseOperatorVisitor, PrismaVisitor } from '@raicampos/query-toolkit';

// Reaproveita o PrismaVisitor e adiciona suporte ao operador custom
const visitor = new PrismaVisitor()
  .registerHandler('regex=', (op, field) => ({
    [field]: { contains: op.value(), mode: 'insensitive' }, // mapeamento para Prisma
  }));
```

Para visitors totalmente customizados, estenda `BaseOperatorVisitor` diretamente:

```typescript
class MyVisitor extends BaseOperatorVisitor<MyResult> {
  visitEquals(op, field) { /* ... */ }
  // ... implemente os 14 métodos built-in ...
  visitUnknown(op, field) { /* fallback */ }
}

const myVisitor = new MyVisitor()
  .registerHandler('regex=', (op, field) => buildRegexClause(field, op.value()));
```

### Limpeza em testes

Use `clearCustom()` para remover apenas operators customizados sem apagar os built-ins:

```typescript
afterEach(() => {
  OperatorRegistry.clearCustom(); // seguro: mantém ==, !=, gt=, etc.
});
```
