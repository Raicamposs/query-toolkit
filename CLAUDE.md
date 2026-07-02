# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build        # Build with tsup (CJS + ESM + types)
npm run test         # Run tests in watch mode (vitest)
npm run coverage     # Run tests with coverage report
npm run lint         # ESLint check
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format src/**
npm run format:check # Check formatting without writing
npm run bump         # Bump patch version
npm run commit       # Commitizen interactive commit
```

Run a single test file:
```bash
npx vitest run src/sql-builder/sql-builder.test.ts
```

Run tests matching a pattern:
```bash
npx vitest run --reporter=verbose -t "ClauseEquals"
```

## Architecture

The package is a TypeScript library with **7 submodule entry points** built by tsup into dual CJS/ESM format. Each submodule maps to a `src/<name>/` directory and is exposed as `@raicampos/query-toolkit/<name>`.

### Module Map

```
src/
├── query-operator/   — Operator classes + OperatorRegistry
├── rsql-parse/       — RsqlStringParser, QueryParamsParse, OperatorRegistry, validation
├── converters/       — Visitor pattern: Prisma, SQL, SQL-string converters
├── sql-builder/      — Fluent parameterized SQL builder + Clause implementations
├── mappers/          — MapperBuilder for Table ↔ Entity transformations
└── common/           — Pagination, SqlInjectionDetector
    └── types/        — Shared types; also exposed as @raicampos/query-toolkit/types
```

### Data Flow

```
URL query string
    → RsqlStringParser.parse()        # "name==John;age=gt=18" → Record<string, string>
    → QueryParamsParse(params)        # resolves each value via OperatorRegistry
    → .operators: ParamsOperators<T>  # Record<field, QueryParamsOperator[]>
    → Converter.build()               # applies a Visitor to produce Prisma/SQL output
```

### Key Design Patterns

**Visitor pattern** — `BaseOperatorVisitor<T>` is the abstract base for all converters. Each concrete visitor (e.g. `PrismaVisitor`, `ClauseVisitor`, `SqlStringVisitor`) implements one `visitXxx()` method per operator type. Custom operators registered via `OperatorRegistry.register()` are dispatched through `visitCustom()` using a per-visitor handler registered with `.registerHandler(symbol, fn)`.

**OperatorRegistry** — A module-level singleton `Map<symbol, resolver>` with longest-prefix matching to avoid collisions (e.g. `!=` vs `!~=`). Use `clearCustom()` in test teardowns — not `clear()` or `resetToDefault()` — to avoid wiping built-in operators.

**SqlBuilder** — Produces `{ sql: string, params: unknown[] }` with positional `$N` parameters for safe parameterized queries. Has configurable security limits (`maxWhereClauses: 20`, `maxOrderByClauses: 5`, `maxLimit: 100`, `maxJoins: 8`). Accepts either a table name string or a full `SELECT` base query.

**MapperBuilder** — Typed `Table ↔ Entity` bidirectional mapper. Keys in the constructor `Mapper<Table, Entity>` go `tableColumn → entityProperty`. Call `entityToModel()` to write to DB, `modelToEntity()` to read from DB. Converters like `.convertStrToDate()` only apply on `entityToModel()`.

**Pagination** — Two strategies: `ClassicPage(limit, page)` with `.offset` property; `CursorPage(limit, cursor)` with base64-encoded bidirectional cursor via `CursorCodec`.

### RSQL Operator Symbols

| Symbol | Operator |
|--------|----------|
| `==` | equals |
| `!=` | notEquals |
| `~=` | contains (ilike) |
| `!~=` | notContains |
| `in=` | in |
| `out=` | notIn |
| `gt=` | greaterThan |
| `gte=` | greaterThanOrEqual |
| `lt=` | lessThan |
| `lte=` | lessThanOrEqual |
| `btw=` | between |
| `@>` | arrayContains |
| `<@` | arrayIsContainedBy |
| `&&` | arrayOverlap |

### Coverage Thresholds

Enforced by vitest: lines 90%, functions 90%, branches 85%, statements 90%.

### Commits

Use `npm run commit` (Commitizen) for conventional commits. All commits must be in Portuguese (pt-BR).