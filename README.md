# @raicamposs/rsql

A TypeScript toolkit for parsing RSQL (REST Query Language) parameters and converting them into different database-friendly formats, such as Prisma `where` clauses and SQL `Clause` objects.

## Features

- **RSQL Parsing**: Convert query strings like `name===John&age=gte=18` into structured operator objects.
- **Visitor Pattern**: Extensible architecture to add new conversion strategies.
- **Prisma Integration**: Direct conversion to Prisma `where` clauses with support for merging multiple filters on the same field.
- **SQL Builder**: Integration with a custom SQL builder using `Clause` objects.
- **Type Safety**: Built with TypeScript and Zod for robust validation.

## Supported Operators

| RSQL | Operator | Description | Prisma Mapping |
| --- | --- | --- | --- |
| `==` | Equals | Exact match | `{ field: value }` |
| `!=` | Not Equals | Different from | `{ field: { not: value } }` |
| `~=` | Contains | Case-insensitive like | `{ field: { contains: value, mode: 'insensitive' } }` |
| `!~=` | Not Contains | Case-insensitive not like | `{ field: { not: { contains: value, mode: 'insensitive' } } }` |
| `in=` | In | Match any in list | `{ field: { in: [values] } }` |
| `out=` | Not In | Match none in list | `{ field: { notIn: [values] } }` |
| `gt=` | Greater Than | Strictly greater than | `{ field: { gt: value } }` |
| `gte=` | Greater Than or Equal | Greater or equal | `{ field: { gte: value } }` |
| `lt=` | Less Than | Strictly less than | `{ field: { lt: value } }` |
| `lte=` | Less Than or Equal | Less or equal | `{ field: { lte: value } }` |
| `btw=` | Between | Range match | `{ field: { gte: start, lte: end } }` |
| `&&` | Overlap | Array overlap | `{ field: { hasSome: [values] } }` |
| `@>` | Array Contains | Array contains all | `{ field: { hasEvery: [values] } }` |

## Installation

```bash
npm install @raicamposs/rsql
```

## Basic Usage

### Parsing Query Parameters

```typescript
import { QueryParamsParse } from '@raicamposs/rsql'

const params = {
  name: '==John',
  age: 'gte=18',
  status: 'in=ACTIVE,PENDING'
}

const parser = new QueryParamsParse(params)
const operators = parser.build() // Record<string, QueryParamsOperator[]>
```

### Converting to Prisma

```typescript
import { QueryParamsConverter } from '@raicamposs/rsql'

const converter = new QueryParamsConverter(operators)
const prismaWhere = converter.toPrisma()

// Result:
// {
//   name: 'John',
//   age: { gte: 18 },
//   status: { in: ['ACTIVE', 'PENDING'] }
// }

const users = await prisma.user.findMany({ where: prismaWhere })
```

### Converting to SQL Clauses

```typescript
const clauses = converter.toClauses() // Record<string, Clause[]>
const sql = new SqlBuilder().where(converter.toClausesArray()).build()
```

## Advanced: Custom Visitors

You can implement your own `OperatorVisitor<T>` to support other formats (e.g., TypeORM, MongoDB, ElasticSearch).

```typescript
import { OperatorVisitor, EqualsOperator } from '@raicamposs/rsql'

class MyElasticVisitor implements OperatorVisitor<ElasticQuery> {
  visitEquals(operator: EqualsOperator, field: string): ElasticQuery {
    return { term: { [field]: operator.value() } }
  }
  // ... implement other methods
}
```

## License

MIT
