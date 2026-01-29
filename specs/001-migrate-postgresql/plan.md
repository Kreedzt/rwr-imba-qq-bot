# Implementation Plan: Migrate from ClickHouse to PostgreSQL

**Branch**: `001-migrate-postgresql` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-migrate-postgresql/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Replace ClickHouse database service with PostgreSQL for command execution logging and analytics. Migration includes:

- Replace ClickHouseService with PostgreSQLService using pg package
- Migrate all query and insert operations in src/commands/log/db.ts and src/commands/index.ts
- Update environment variables from CLICKHOUSE*\* to PG*\*
- Maintain existing API contract and query result formats
- Ensure graceful error handling and connection management

## Technical Context

**Language/Version**: TypeScript 5.7.2 with Node.js 22.11.0
**Primary Dependencies**: pg (PostgreSQL client), Fastify (web framework)
**Storage**: PostgreSQL (migrating from ClickHouse)
**Testing**: Vitest
**Target Platform**: Node.js server
**Project Type**: Single project (web application)
**Performance Goals**: Command logging <100ms, queries <200ms for datasets up to 10k records
**Constraints**: TypeScript strict mode, maintain modular command structure, graceful degradation on database failures
**Scale/Scope**: ~10k commands/day, concurrent operations up to 50

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Principle I: Modular Command System

✅ **PASS** - PostgreSQLService will be a singleton service accessed via ClickHouseService interface pattern, maintaining independent command modules. Commands will not have direct database dependencies.

### Principle II: Type Safety & Strict Mode

✅ **PASS** - All PostgreSQL operations will use TypeScript with strict typing. Query results will be explicitly typed matching existing interfaces.

### Principle III: Environment-First Configuration

✅ **PASS** - All configuration via environment variables (PG_HOST, PG_DB, PG_USER, PG_PASSWORD). Validation at startup.

### Principle IV: Observability & Logging

✅ **PASS** - All database operations will use structured logging via tracer. Error context will include sufficient debugging information.

### Principle V: Graceful Degradation & Error Handling

✅ **PASS** - Database failures will be handled gracefully without crashing. Retry logic with exponential backoff for connection failures.

### Principle VI: Image Generation via Canvas

✅ **PASS** - Not applicable to this feature.

### Principle VII: Testing Discipline

✅ **PASS** - Tests will use Vitest. Unit tests co-located with implementation. Coverage maintained above 70%.

### Security & Rate Limiting

✅ **PASS** - All queries will use parameterized statements to prevent SQL injection. Environment variables for credentials.

### Performance Standards

✅ **PASS** - Operations will complete within specified performance goals (<100ms logging, <200ms queries). Optimized queries with indexes.

### Data Privacy

✅ **PASS** - User data logging maintained for analytics with same privacy protections. No personal data in error messages.

**Overall Gate Status (Pre-Phase 0)**: ✅ **PASS** - No violations detected. Proceed to Phase 0.

**Overall Gate Status (Post-Phase 1)**: ✅ **PASS** - No violations detected. Design confirmed compliant with Constitution. Proceed to Phase 2.

## Project Structure

### Documentation (this feature)

```text
specs/001-migrate-postgresql/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── services/
│   ├── postgresql.service.ts    # NEW: PostgreSQL service implementation
│   └── clickHouse.service.ts    # REMOVED: ClickHouse service (delete after migration)
├── commands/
│   ├── log/
│   │   └── db.ts                 # MODIFIED: Update to use PostgreSQLService
│   └── index.ts                  # MODIFIED: Update insertCmdData call
├── routes.ts                     # MODIFIED: Update environment variable check
├── shutdown.ts                   # MODIFIED: Update close() call
├── utils/
│   └── env.ts                    # MODIFIED: Add PG_* environment variable types
└── types.ts                      # MODIFIED: Update GlobalEnv interface

tests/
├── unit/
│   ├── services/
│   │   └── postgresql.service.test.ts  # NEW: PostgreSQL service tests
│   └── commands/
│       └── log/
│           └── db.test.ts                # MODIFIED: Update tests for PostgreSQL
└── integration/
    └── database.test.ts            # NEW: Integration tests for database operations

init.sql                             # MODIFIED: PostgreSQL schema instead of ClickHouse
```

**Structure Decision**: Single project structure maintained. New PostgreSQL service follows existing service pattern in src/services/. Modified files preserve existing modular command structure. Tests follow co-location pattern per Constitution Principle VII.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
|           |            |                                      |
