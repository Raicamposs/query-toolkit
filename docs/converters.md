# 🔄 Converters & Integração Prisma/SQL

O módulo `converters` implementa o padrão **Visitor** para transformar operadores (`QueryParamsOperator`) no formato de destino desejado: objetos `where` do Prisma ou cláusulas SQL parametrizadas.

---

## 🏗️ O Padrão Visitor no Core

As classes de operadores representam estruturas puras de domínio. Os visitors isolam as regras de infraestrutura sem acoplar lógica de persistência nos operadores.

A biblioteca disponibiliza três implementações de `OperatorVisitor<R>`:

1. **`ClauseVisitor`** — transforma operadores em cláusulas SQL parametrizadas (`Clause[]`)
2. **`PrismaVisitor`** — transforma operadores em objetos parciais compatíveis com o Prisma ORM
3. **`SqlStringVisitor`** — transforma operadores diretamente em fragmentos SQL como `string`

Todos estendem `BaseOperatorVisitor`, que fornece suporte automático a operadores customizados via `registerHandler()`.

---

## ⚡ Conversores de Conveniência

### 1. `QueryParamsPrismaConverter`

Transforma operadores diretamente em um objeto compatível com a propriedade `where` do Prisma Client. O retorno é tipado como `Record<string, PrismaWhereValue>`.

#### Fusão inteligente de condições no mesmo campo

Se o mesmo campo receber múltiplos filtros (`price=gt=10;price=lt=50`), o conversor **funde as condições** em um único objeto estruturado:

```typescript
import { QueryParamsParse, QueryParamsPrismaConverter } from '@raicampos/query-toolkit';

const rawParams = {
  age: ['gte=18', 'lte=60'],
  status: '==ACTIVE',
};

const { operators } = new QueryParamsParse(rawParams);
const where = new QueryParamsPrismaConverter(operators).build();

// {
//   status: 'ACTIVE',
//   age: { gte: 18, lte: 60 }
// }
```

### 2. `QueryParamsSqlConverter`

Converte operadores em uma lista de objetos `Clause` para uso com o `SqlBuilder` (queries parametrizadas).

```typescript
import { QueryParamsParse, QueryParamsSqlConverter, SqlBuilder } from '@raicampos/query-toolkit';

const rawParams = {
  name: '~=John',
  status: '==ACTIVE',
};

const { operators } = new QueryParamsParse(rawParams);
const clauses = new QueryParamsSqlConverter(operators).build();

const { sql, params } = SqlBuilder.from('users')
  .whereClauses(clauses)
  .build();

// sql:    "SELECT * FROM users WHERE (name ILIKE $1) AND (status = $2)"
// params: ['%John%', 'ACTIVE']
```

### 3. `QueryParamsSqlStringConverter`

Gera uma **string SQL pronta** com as condições unidas por AND. Indicado para ORMs ou query builders externos que aceitam fragmentos SQL como string, ou para logging e debugging.

Os valores são escapados via `SqlPrimitiveValue` — mesma proteção contra SQL Injection usada pelo `SqlBuilder`.

```typescript
import { QueryParamsParse, QueryParamsSqlStringConverter } from '@raicampos/query-toolkit';

const rawParams = {
  nome: '~=John',
  preco: ['gte=10', 'lte=50'],
  status: '==ACTIVE',
};

const { operators } = new QueryParamsParse(rawParams);
const converter = new QueryParamsSqlStringConverter(operators);

// WHERE completo como string
const where = converter.build();
// "nome ILIKE '%John%' AND preco >= 10 AND preco <= 50 AND status = 'ACTIVE'"

// ORDER BY como string
const orderBy = converter.sort({ nome: 'asc', preco: 'desc' });
// "nome ASC, preco DESC"

// WHERE + ORDER BY em uma única chamada
const { where: w, orderBy: o } = converter.buildQuery({ nome: 'asc' });
```

> **Quando usar `QueryParamsSqlStringConverter` vs `QueryParamsSqlConverter`?**
> - `QueryParamsSqlConverter` → use com o `SqlBuilder` quando precisar de queries **parametrizadas** (`$1`, `$2`, …) — a forma mais segura.
> - `QueryParamsSqlStringConverter` → use quando a integração com um ORM ou query builder externo exige uma **string SQL direta**. Os valores ainda são escapados, mas interpolados na string.

---

## 🚀 Exemplo em Repositório (Clean Architecture)

A camada de apresentação passa filtros neutros de domínio; o repositório converte para a infraestrutura específica.

### Repositório Prisma

```typescript
import { PrismaClient } from '@prisma/client';
import { QueryParamsPrismaConverter } from '@raicampos/query-toolkit';
import { CoffeeFilters } from '../domain/coffee-filters';

export class CoffeePrismaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(filters: CoffeeFilters) {
    const where = new QueryParamsPrismaConverter(filters).build();
    return this.prisma.coffee.findMany({ where, orderBy: { name: 'asc' } });
  }
}
```

### Repositório SQL Nativo

```typescript
import { Client } from 'pg';
import { QueryParamsSqlConverter, SqlBuilder } from '@raicampos/query-toolkit';
import { CoffeeFilters } from '../domain/coffee-filters';

export class CoffeePgRepository {
  constructor(private readonly db: Client) {}

  async list(filters: CoffeeFilters) {
    const clauses = new QueryParamsSqlConverter(filters).build();

    const { sql, params } = SqlBuilder.from('coffees')
      .whereClauses(clauses)
      .addOrder('asc', 'name')
      .build();

    return (await this.db.query(sql, params)).rows;
  }
}
```

---

## 🛡️ Estratégia de Fail-Fast

Os visitors lançam exceções explícitas ao encontrar dados inválidos:

- **`BetweenOperator` com valor inválido** — lança `Error` se `value()` retornar `null` (ex: apenas um número fornecido ao `btw=`)
- **Operador `<@` no Prisma** — lança `UnsupportedOperatorError` (tipado, capturável com `instanceof`) porque o Prisma não suporta `arrayIsContainedBy` nativamente:

```typescript
import { UnsupportedOperatorError } from '@raicampos/query-toolkit';

try {
  const where = new QueryParamsPrismaConverter(operators).build();
} catch (e) {
  if (e instanceof UnsupportedOperatorError) {
    // e.operatorSymbol → '<@'
    // e.field          → nome do campo afetado
    console.warn(`Operador "${e.operatorSymbol}" não suportado no Prisma para o campo "${e.field}"`);
  }
}
```
