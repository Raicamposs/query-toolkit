# @raicampos/query-toolkit

Toolkit TypeScript para construção de queries de banco de dados. Fornece ferramentas para parsing RSQL, construção SQL e mapeamento de dados.

## Funcionalidades

- **Parsing RSQL**: Converte query strings como `name==John;age=gte=18` em objetos de operadores tipados.
- **SQL Builder**: API fluente para construção de queries SQL com mapeamento automático de colunas e validação.
- **Mapeadores de Dados**: Mapeamento bidirecional entre entidades de banco de dados e modelos de domínio.
- **Operadores Flexíveis**: Suporte a operadores de comparação, lógicos e de array.
- **Segurança de Tipos**: Construído com TypeScript para validação robusta e suporte a IDEs.

## Instalação

```bash
npm install @raicampos/query-toolkit
```

## 🛡️ Queries Parametrizadas (Recomendado)

O `@raicampos/query-toolkit` suporta queries parametrizadas, fundamentais para prevenir SQL Injection.

```typescript
import { SqlBuilder, ClauseEquals, ClauseGreaterThan } from '@raicampos/query-toolkit';

const builder = SqlBuilder.from('users');
builder.whereEquals('status', 'active');
builder.whereGreaterThan('age', 18);

// Retorna { sql: "SELECT * FROM users WHERE (status = $1) AND (age > $2)", params: ['active', 18] }
const { sql, params } = builder.build();

// Use com o driver do seu banco (ex: pg)
await db.query(sql, params);
```

## Componentes Principais

### 1. SQL Builder

Construção de queries SQL complexas com interface fluente.

```typescript
import { SqlBuilder } from '@raicampos/query-toolkit';

const { sql, params } = SqlBuilder.from('users')
  .whereEquals('status', 'active')
  .whereGreaterThan('age', 18)
  .addOrder('desc', 'created_at')
  .addLimit(10)
  .build();
// sql:    "SELECT * FROM users WHERE (status = $1) AND (age > $2) ORDER BY created_at DESC LIMIT 10"
// params: ['active', 18]
```

### 2. Parsing RSQL

Parse de parâmetros RSQL oriundos de query strings da URL.

```typescript
import { QueryParamsParse } from '@raicampos/query-toolkit';

const params = {
  name: '==John',
  age: 'gte=18',
  status: 'in=ACTIVE,PENDING',
};

const { operators } = new QueryParamsParse(params);
// Record<string, QueryParamsOperator[]>
```

### 3. Mapper Builder

Mapeamento entre entidades de banco de dados e modelos de domínio limpos.

```typescript
import { MapperBuilder } from '@raicampos/query-toolkit';

const mapeamento = {
  id: 'user_id',
  email: 'user_email',
  nome: 'full_name',
};

const mapper = new MapperBuilder(mapeamento);
const modelo = mapper.entityToModel({
  user_id: 1,
  user_email: 'joao@exemplo.com',
  full_name: 'João Silva',
});
// { id: 1, email: 'joao@exemplo.com', nome: 'João Silva' }
```

### 4. Conversores (Visitors)

Convertem operadores de query params em formatos específicos (objeto `where` do Prisma ou cláusulas SQL) usando o padrão Visitor com segurança de tipos completa.

```typescript
import { QueryParamsParse, QueryParamsPrismaConverter, QueryParamsSqlConverter, QueryParamsSqlStringConverter } from '@raicampos/query-toolkit';

const params = { status: '==active', age: 'gt=18' };
const { operators } = new QueryParamsParse(params);

// 1. Converte para objeto where do Prisma (funde condições de campos automaticamente)
const where = new QueryParamsPrismaConverter(operators).build();
// { status: 'active', age: { gt: 18 } }

// 2. Converte para Cláusulas do SqlBuilder (queries parametrizadas)
const clauses = new QueryParamsSqlConverter(operators).build();
// Record<string, Clause[]>

// 3. Converte para string SQL direta
const converter = new QueryParamsSqlStringConverter(operators);
const whereStr = converter.build();       // "status = 'active' AND age > 18"
const { where: w, orderBy } = converter.buildQuery({ age: 'desc' });
```

### 5. Paginação (Clássica e por Cursor)

Paginação robusta e dinâmica com estratégias **Clássica** (offset/limit) e **por Cursor** (bidirecional, base64 minificado).

```typescript
import { CursorPage, ClassicPage } from '@raicampos/query-toolkit';

// A. Paginação por Cursor (alto desempenho para scroll infinito e grandes datasets)
const paginacaoCursor = new CursorPage(20, 'eyJ2Ijp7ImlkIjoyfSwiZCI6MSwibyI6eyJpZCI6MX19');

// B. Paginação Clássica (tradicional offset/limit)
const paginacaoClassica = new ClassicPage(20, 2); // limit=20, página=2
console.log(paginacaoClassica.offset); // 20
```

## 🚀 Uso Avançado

### 1. Queries com Segurança de Tipos

Use TypeScript para garantir que apenas campos válidos da sua entidade sejam consultados.

```typescript
import { SqlBuilder } from '@raicampos/query-toolkit';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  metadata: { ultimoAcesso: Date }; // não queryável por padrão
}

// Autocomplete para 'nome', 'email', 'id'
// Erro de tipo para 'metadata' ou campos inválidos
const builder = SqlBuilder.from<Usuario>('usuarios');
builder.whereEquals('nome', 'João');
```

### 2. Limites de Segurança Configuráveis

Sobrescreva os limites padrão para queries complexas.

```typescript
const builder = new SqlBuilder<Usuario>('usuarios', undefined, {
  maxWhereClauses: 50,   // Padrão: 20
  maxOrderByClauses: 10, // Padrão: 5
  maxLimit: 1000,        // Padrão: 100
});
```

### 3. Validação com Erros Estruturados

`validate()` retorna `ValidationResult` com `ValidationError[]` — objetos com `field`, `code` e `message`. `validateOrThrow()` lança `ValidationException` na primeira falha.

```typescript
import {
  QueryParamsParse,
  ValidationException,
  ValidationError,
} from '@raicampos/query-toolkit';

const parser = new QueryParamsParse(rawParams, {
  age: {
    type: 'number',
    validate: (v: number) => v >= 18 || 'Deve ser maior de idade',
  },
  tags: 'string[]',   // FieldTypes suporta arrays
  sort: 'name:asc',   // campos fora do schema são detectados
});

// Opção A — safe parse
const { success, errors } = parser.validate();
if (!success) {
  errors.forEach((err: ValidationError) => {
    // { field: 'age', code: 'CUSTOM_VALIDATION_FAILED', message: 'Deve ser maior de idade' }
  });
}

// Opção B — fail fast (lança ValidationException)
try {
  parser.validateOrThrow();
} catch (e) {
  if (e instanceof ValidationException) {
    reply.status(400).send({ details: e.errors }); // details é ValidationError[]
  }
}
```

### 4. Parsing RSQL Completo

```typescript
import { RsqlStringParser, QueryParamsParse } from '@raicampos/query-toolkit';

const filter = 'name==John;age=gt=18;status=in=ACTIVE,PENDING';
const rawParams = new RsqlStringParser(filter).parse();
const { operators } = new QueryParamsParse(rawParams);
```

### 5. Operadores Customizados

Registre novos operadores sem modificar o core da biblioteca (Princípio Aberto-Fechado).

```typescript
import { CustomQueryParamsOperator, OperatorRegistry, BaseOperatorVisitor } from '@raicampos/query-toolkit';

// 1. Defina o operador estendendo CustomQueryParamsOperator
class RegexOperator extends CustomQueryParamsOperator<{ regex: string }, string> {
  constructor(params: string) { super('regex=', params); }
  safeParse() { /* ... */ }
  value() { return this.getRawValue() || null; }
  query() { const v = this.value(); return v ? { regex: v } : null; }
}

// 2. Registre o símbolo
OperatorRegistry.register('regex=', (params) => new RegexOperator(params));

// 3. Adicione suporte no visitor via registerHandler()
const visitor = new MeuVisitor()
  .registerHandler('regex=', (op, field) => ({ [field]: { regex: op.value() } }));
```

### 5. Recursos de Segurança

```typescript
import { SqlInjectionDetector } from '@raicampos/query-toolkit';

// Uso estático (instância padrão compartilhada)
SqlInjectionDetector.detect("' OR 1=1");         // true
SqlInjectionDetector.configure({ strictMode: true }); // lança Error em vez de avisar

// Uso por instância (configuração isolada por módulo)
const detector = new SqlInjectionDetector({ strictMode: true });
detector.detectAndWarn(inputUsuario);
```

## 👨‍🍳 Receitas

### Integração com Prisma (sem SQL manual)

```typescript
import { RsqlStringParser, QueryParamsParse, QueryParamsPrismaConverter } from '@raicampos/query-toolkit';

// URL: /usuarios?filter=status==ACTIVE;age=gte=18;role=in=ADMIN,MANAGER
const rawParams = new RsqlStringParser(req.query.filter).parse();
const { operators } = new QueryParamsParse(rawParams);

const where = new QueryParamsPrismaConverter(operators).build();
// {
//   status: 'ACTIVE',
//   age:    { gte: 18 },
//   role:   { in: ['ADMIN', 'MANAGER'] },
// }

const usuarios = await prisma.usuario.findMany({ where });
```

> **Quando usar `QueryParamsPrismaConverter` vs `SqlBuilder`?**
> - `QueryParamsPrismaConverter` → fluxo padrão com Prisma ORM, sem SQL escrito à mão, ideal para a maioria dos casos.
> - `SqlBuilder` → necessário quando você usa raw SQL (`$queryRaw`), precisa de JOINs, subqueries complexas ou banco não suportado pelo Prisma.

### Operadores suportados pelo `QueryParamsPrismaConverter`

| Operador RSQL | Sintaxe | Prisma gerado |
|---|---|---|
| Igualdade | `==ACTIVE` | `'ACTIVE'` |
| Diferença | `!=ACTIVE` | `{ not: 'ACTIVE' }` |
| Contém (case-insensitive) | `~=john` | `{ contains: 'john', mode: 'insensitive' }` |
| Maior Que | `gt=18` | `{ gt: 18 }` |
| Maior ou Igual | `gte=18` | `{ gte: 18 }` |
| Menor Que | `lt=100` | `{ lt: 100 }` |
| Menor ou Igual | `lte=100` | `{ lte: 100 }` |
| Entre | `btw=20,60` | `{ gte: 20, lte: 60 }` |
| Contido em Lista | `in=A,B,C` | `{ in: ['A','B','C'] }` |
| Não Contido | `out=X,Y` | `{ notIn: ['X','Y'] }` |

### Integração com NestJS (Pipe)

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { RsqlStringParser, QueryParamsParse } from '@raicampos/query-toolkit';

@Injectable()
export class RsqlPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      const rawParams = new RsqlStringParser(value).parse();
      return new QueryParamsParse(rawParams);
    }
    return value;
  }
}
```

## 📦 Exports por Submódulo

O pacote suporta imports por submódulo:

- `@raicampos/query-toolkit/common` — Utilitários e `SqlInjectionDetector`
- `@raicampos/query-toolkit/converters` — `BaseOperatorVisitor`, `ClauseVisitor`, `PrismaVisitor`, `SqlStringVisitor`, `QueryParamsPrismaConverter`, `QueryParamsSqlConverter`, `QueryParamsSqlStringConverter` e `UnsupportedOperatorError`
- `@raicampos/query-toolkit/mappers` — `MapperBuilder` e mapeamento de dados
- `@raicampos/query-toolkit/query-operator` — Operadores individuais (`EqualsOperator`, `GreaterThanOperator`, `CustomQueryParamsOperator`, etc.)
- `@raicampos/query-toolkit/rsql-parse` — `QueryParamsParse`, `RsqlStringParser` e `OperatorRegistry`
- `@raicampos/query-toolkit/sql-builder` — `SqlBuilder` e cláusulas SQL (`ClauseAnd`, `ClauseOr`, etc.)
- `@raicampos/query-toolkit/types` — Definições de tipos, `QueryableFields` e `OperatorSymbol`

## 📄 Licença

MIT
