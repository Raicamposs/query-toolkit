# @raicamposs/query-toolkit

A powerful TypeScript toolkit for building database queries. It provides tools for RSQL parsing, SQL building, and data mapping.

## Features

- **RSQL Parsing**: Convert query strings like `name===John&age=gte=18` into structured operator objects.
- **SQL Builder**: A fluent API for building SQL queries with automatic column mapping and validation.
- **Data Mappers**: Easily map between database entities and domain models.
- **Flexible Operators**: Support for comparison, logical, and array operators.
- **Type Safety**: Built with TypeScript and Zod for robust validation and IDE support.

## Installation

```bash
npm install @raicamposs/query-toolkit
```

## Core Components

### 1. SQL Builder

Build complex SQL queries with a fluent interface.

```typescript
import { SqlBuilder } from '@raicamposs/query-toolkit';

const builder = new SqlBuilder('SELECT * FROM users');

builder
  .whereEquals('status', 'active')
  .whereGreaterThan('age', 18)
  .addOrder('desc', 'created_at')
  .addLimit(10);

const sql = builder.build();
// SELECT * FROM users WHERE (status = 'active') AND (age > 18) ORDER BY created_at DESC LIMIT 10
```

### 2. RSQL Parsing

Parse RSQL parameters from URL query strings.

```typescript
import { QueryParamsParse } from '@raicamposs/query-toolkit';

const params = {
  name: '==John',
  age: 'gte=18',
  status: 'in=ACTIVE,PENDING'
};

const parser = new QueryParamsParse(params);
const operators = parser.build(); // Record<string, QueryParamsOperator[]>
```

### 3. Mapper Builder

Map your database entities to clean domain models.

```typescript
import { MapperBuilder } from '@raicamposs/query-toolkit';

const userMapper = {
  id: 'user_id',
  email: 'user_email',
  name: 'full_name'
};

const builder = new MapperBuilder(userMapper);
const model = builder.entityToModel({
  user_id: 1,
  user_email: 'john@example.com',
  full_name: 'John Doe'
});
```

## 🚀 Advanced Usage

### 1. Type-Safe Querying

Leverage TypeScript to ensure you only query valid fields from your entities.

```typescript
import { SqlBuilder, QueryableFields } from '@raicamposs/query-toolkit';

interface User {
  id: number;
  name: string;
  email: string;
  metadata: { lastLogin: Date }; // Not queryable by default
}

// Autocomplete for 'name', 'email', 'id'
// Error for 'metadata' or 'invalid'
const builder = SqlBuilder.from<User>('users');
builder.whereEquals('name', 'John');
```

### 2. Configurable Safety Limits

Override default safety limits for complex queries.

```typescript
const builder = new SqlBuilder<User>('users', undefined, {
  maxWhereClauses: 50,    // Default: 20
  maxOrderByClauses: 10,  // Default: 5
  maxLimit: 1000,         // Default: 100
});
```

### 3. Standardized RSQL Parsing

Parse full RSQL strings easily with `RsqlStringParser`.

```typescript
import { RsqlStringParser, QueryParamsParse } from '@raicamposs/query-toolkit';

const filter = "name==John;age=gt=18;status=in=ACTIVE,PENDING";
const parser = new RsqlStringParser(filter);
const rawParams = parser.parse(); 

const queryParams = new QueryParamsParse(rawParams).build();
```

### 4. Security Features

- **SQL Injection Protection**: Detects and blocks dangerous patterns (e.g., `; DROP TABLE`).
- **Smart Wildcards**: The `contains` (`~=`) operator automatically wraps values with `%` for true partial matching (`ILIKE '%value%'`).

## 👨‍🍳 Cookbook

### NestJS Integration (Pipe)

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { RsqlStringParser, QueryParamsParse, QueryParamsConverter } from '@raicamposs/query-toolkit';

@Injectable()
export class RsqlPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      const raw = new RsqlStringParser(value).parse();
      const ops = new QueryParamsParse(raw).build();
      return new QueryParamsConverter(ops);
    }
    return value;
  }
}
```

## 📦 Subpath Exports

The package supports clean subpath exports:

- `@raicamposs/query-toolkit/common` - Utilities like `parseRsqlValue`
- `@raicamposs/query-toolkit/mappers` - `MapperBuilder` and data mapping
- `@raicamposs/query-toolkit/query-operator` - Individual operator implementations
- `@raicamposs/query-toolkit/rsql-parse` - `QueryParamsParse` and `RsqlStringParser`
- `@raicamposs/query-toolkit/sql-builder` - `SqlBuilder` and SQL clauses
- `@raicamposs/query-toolkit/types` - Type definitions and `QueryableFields`

## 📄 License

MIT
