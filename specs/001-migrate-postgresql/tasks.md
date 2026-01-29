# Tasks: Migrate from ClickHouse to PostgreSQL

**Input**: Design documents from `/specs/001-migrate-postgresql/`
**Feature**: 001-migrate-postgresql
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are optional. Included only for critical components.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and database schema

### Setup Tasks

- [ ] T001 [P] Create `init.sql` with PostgreSQL table schema and indexes per data-model.md
- [ ] T002 Update `.env.example` with new PG*\* variables (remove CLICKHOUSE*\*)
- [ ] T003 Install `@types/pg` dev dependency: `pnpm install -D @types/pg`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Foundational Tasks

- [ ] T004 [P] Update `src/types.ts` - Add PG\_\* variables to `GlobalEnv` interface
- [ ] T005 [P] Update `src/utils/env.ts` - Add PG\_\* variable validation
- [ ] T006 Create `src/services/postgresql.service.ts` with singleton pattern and connection pool
- [ ] T007 Create `src/services/postgresql.service.types.ts` - TypeScript interfaces (CmdData, QueryResult, etc.)
- [ ] T008 Implement `insertCmdData()` method in PostgreSQLService
- [ ] T009 Implement `queryCmd()` method in PostgreSQLService
- [ ] T010 Implement `close()` method for connection cleanup
- [ ] T011 Add retry logic with exponential backoff for transient failures
- [ ] T012 [P] Create `tests/unit/services/postgresql.service.test.ts` - Unit tests for core methods

**Checkpoint**: Foundation ready - PostgreSQL service works in isolation

---

## Phase 3: User Story 1 - Database Connection (Priority: P1) 🎯 MVP

**Goal**: System establishes and maintains persistent connection to PostgreSQL database

**Independent Test**: Verify connection via startup logs and connection pool status. Can test independently by running application and checking console output.

### Implementation for User Story 1

- [ ] T013 [US1] Implement connection error handling with graceful degradation in `src/services/postgresql.service.ts`
- [ ] T014 [US1] Add connection pool health monitoring (optional, for debugging)
- [ ] T015 [US1] Test database connection on application startup in `src/routes.ts`

**Acceptance Criteria**:

- Connection establishes successfully when database is available
- Connection fails gracefully without crashing when database is unavailable
- System continues normal operation even with database errors

**Checkpoint**: User Story 1 complete - Connection management works

---

## Phase 4: User Story 2 - Command Logging (Priority: P1) 🎯 MVP

**Goal**: System automatically records every command execution to PostgreSQL

**Independent Test**: Execute a command and verify record exists in database using SQL query. Can test by running `INSERT` queries directly against database.

### Implementation for User Story 2

- [ ] T016 [P] [US2] Update `src/commands/index.ts` - Replace ClickHouseService with PostgreSQLService
- [ ] T017 [US2] Update `src/commands/index.ts` - Change environment check from `CLICKHOUSE_HOST` to `PG_HOST`
- [ ] T018 [P] [US2] Update `src/commands/log/db.ts` - Replace ClickHouseService import with PostgreSQLService
- [ ] T019 [P] [US2] Update `src/commands/log/db.ts` - Replace all query methods with PostgreSQL equivalents
- [ ] T020 [P] [US2] Update `src/commands/log/db.ts` - Use parameterized queries ($1, $2 syntax)
- [ ] T021 [US2] Add error handling for failed insert operations (don't crash on DB errors)
- [ ] T022 [P] [US2] Update `tests/unit/commands/log/db.test.ts` - Test PostgreSQL queries

**Acceptance Criteria**:

- Every command execution is logged to database
- Failed commands still log partial data
- System continues operating if database is unavailable
- Queries use parameterized syntax for security

**Checkpoint**: User Story 2 complete - Command logging works end-to-end

---

## Phase 5: User Story 3 - Query Statistics (Priority: P2)

**Goal**: Users can query command statistics including usage patterns and analytics

**Independent Test**: Insert test data directly into database, then run query functions. Can test independently without command execution.

### Implementation for User Story 3

- [ ] T023 [P] [US3] Implement `getAllCmdLog()` - Top 10 commands with counts in `src/commands/log/db.ts`
- [ ] T024 [P] [US3] Implement `getLogByCmd()` - Top 10 parameters for specific command
- [ ] T025 [P] [US3] Implement `getLogByUser()` - Top 10 commands for specific user
- [ ] T026 [P] [US3] Implement `getLogByCmdAndUser()` - Top 10 params for user+command combo
- [ ] T027 [P] [US3] Implement `getAllCmdLog7Days()` - Last 7 days command stats
- [ ] T028 [P] [US3] Implement `getLogByCmd7Days()` - Last 7 days params for command
- [ ] T029 [US3] Add response formatting to match existing output format
- [ ] T030 [P] [US3] Create `tests/unit/commands/log/db.test.ts` - Test all query functions

**Acceptance Criteria**:

- All query functions return top 10 results ordered by count
- Time-based queries use PostgreSQL INTERVAL syntax
- Results match existing ClickHouse output format
- Query performance < 200ms for 10k records

**Checkpoint**: User Story 3 complete - Statistics queries work

---

## Phase 6: User Story 4 - HTTP Endpoint (Priority: P2)

**Goal**: System provides HTTP endpoint for external access to command logs

**Independent Test**: Start server, make HTTP GET request to endpoint. Can test independently with mock data.

### Implementation for User Story 4

- [ ] T031 [US4] Update `src/routes.ts` - Change environment check from `CLICKHOUSE_DB` to `PG_DB`
- [ ] T032 [US4] Update `src/routes.ts` - Replace ClickHouseService with PostgreSQLService
- [ ] T033 [US4] Update `src/routes.ts` - Replace queryCmd() call with PostgreSQL version
- [ ] T034 [US4] Ensure HTTP response format matches existing 2D array structure
- [ ] T035 [US4] Add error handling for database connection failures in route
- [ ] T036 [P] [US4] Create `tests/contract/api.test.ts` - Test HTTP endpoint response format

**Acceptance Criteria**:

- GET /query_cmd returns all log records in tabular format
- Response is 2D array with header row + data rows
- Error responses follow API contract
- Works independently of command execution

**Checkpoint**: User Story 4 complete - HTTP endpoint works

---

## Phase 7: User Story 5 - Graceful Shutdown (Priority: P3)

**Goal**: System properly closes database connection during shutdown

**Independent Test**: Start application, send shutdown signal, verify connection closes cleanly.

### Implementation for User Story 5

- [ ] T037 [US5] Update `src/shutdown.ts` - Change environment check from `CLICKHOUSE_DB` to `PG_DB`
- [ ] T038 [US5] Update `src/shutdown.ts` - Replace ClickHouseService.close() with PostgreSQLService.close()
- [ ] T039 [US5] Add graceful shutdown with pending operation completion
- [ ] T040 [US5] Add shutdown timeout handling (force close after timeout)
- [ ] T041 [P] [US5] Create `tests/integration/shutdown.test.ts` - Test graceful shutdown

**Acceptance Criteria**:

- Database connection closes cleanly on shutdown signal
- Pending operations complete before connection closes
- No memory leaks or hanging connections
- Shutdown completes within 5 seconds

**Checkpoint**: User Story 5 complete - Graceful shutdown works

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, documentation, and final improvements

### Polish Tasks

- [ ] T042 [P] Delete `src/services/clickHouse.service.ts` (old ClickHouse service)
- [ ] T043 Update all import statements that reference ClickHouseService (if any remain)
- [ ] T044 Update AGENTS.md with PostgreSQL migration notes
- [ ] T045 Run full test suite: `npm test && npm run lint`
- [ ] T046 Performance validation - verify queries complete < 200ms
- [ ] T047 Code review - check all SQL uses parameterized queries
- [ ] T048 Verify no ClickHouse environment variables remain in codebase

**Final Checkpoint**: Feature complete and ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS all user stories)
    ↓
Phase 3: User Story 1 (P1) ← MVP checkpoint here
    ↓ (can proceed in parallel after US1)
Phase 4: User Story 2 (P1)
    ↓
Phase 5: User Story 3 (P2)
    ↓
Phase 6: User Story 4 (P2)
    ↓
Phase 7: User Story 5 (P3)
    ↓
Phase 8: Polish
```

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - Can start after Foundational
- **User Story 2 (P1)**: Depends on US1 (needs PostgreSQLService) - Can start after US1
- **User Story 3 (P2)**: Depends on US2 (needs database with data) - Can start after US2
- **User Story 4 (P2)**: Depends on US1 (needs working service) - Can start after US1
- **User Story 5 (P3)**: Depends on US1 (needs service to close) - Can start after US1

**NOTE**: Stories 3, 4, and 5 can all proceed in parallel after their respective dependencies are met.

### Within Each User Story

- Models before services
- Services before endpoints/commands
- Core implementation before integration
- Tests first (if included), then implementation

---

## Parallel Opportunities

### Phase 1 (Setup) - All Parallel

All 3 tasks can run in parallel:

- T001: Create init.sql
- T002: Update .env.example
- T003: Install @types/pg

### Phase 2 (Foundational) - Mixed Parallelism

**Parallel Group 1** (no dependencies):

- T004: Update types.ts
- T005: Update env.ts

**Sequential** (dependencies):

- T006 → T007 → T008 → T009 → T010 → T011

**Parallel Group 2** (after T011):

- T012: Unit tests

### User Stories - High Parallelism After US1

After User Story 1 is complete:

- User Story 2, 3, 4, and 5 can all proceed in parallel
- Within each story, tasks marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (3 tasks)
2. Complete Phase 2: Foundational (12 tasks) - **CRITICAL**
3. Complete Phase 3: User Story 1 (3 tasks)
4. **STOP and VALIDATE**: Test database connection independently
5. Deploy/demo if ready

**MVP Deliverable**: Working PostgreSQL database connection with basic service

### Incremental Delivery

After MVP, continue incrementally:

1. Add User Story 2 (Command Logging) → Test → Deploy
2. Add User Story 3 (Query Statistics) → Test → Deploy
3. Add User Story 4 (HTTP Endpoint) → Test → Deploy
4. Add User Story 5 (Graceful Shutdown) → Test → Deploy
5. Polish phase → Final validation → Production

Each story adds value and can be demonstrated independently.

### Parallel Team Strategy

With multiple developers:

1. All developers complete Phase 1 + Phase 2 together (foundation)
2. Once foundation is ready:
    - Developer A: User Story 1 + 2 (Connection + Logging)
    - Developer B: User Story 3 (Query Statistics)
    - Developer C: User Story 4 + 5 (HTTP + Shutdown)
3. Stories integrate as they complete
4. All developers participate in Polish phase

---

## Task Summary

### Total Task Count: 48 tasks

| Phase                 | Task Count | Description                              |
| --------------------- | ---------- | ---------------------------------------- |
| Phase 1: Setup        | 3 tasks    | Project initialization                   |
| Phase 2: Foundational | 12 tasks   | Core infrastructure (BLOCKS all stories) |
| Phase 3: US1 (P1)     | 3 tasks    | Database connection (MVP)                |
| Phase 4: US2 (P1)     | 7 tasks    | Command logging                          |
| Phase 5: US3 (P2)     | 8 tasks    | Query statistics                         |
| Phase 6: US4 (P2)     | 6 tasks    | HTTP endpoint                            |
| Phase 7: US5 (P3)     | 5 tasks    | Graceful shutdown                        |
| Phase 8: Polish       | 8 tasks    | Cleanup and finalization                 |

### Task Count Per User Story

| User Story               | Priority | Task Count |
| ------------------------ | -------- | ---------- |
| US1: Database Connection | P1       | 3 tasks    |
| US2: Command Logging     | P1       | 7 tasks    |
| US3: Query Statistics    | P2       | 8 tasks    |
| US4: HTTP Endpoint       | P2       | 6 tasks    |
| US5: Graceful Shutdown   | P3       | 5 tasks    |

### Parallel Opportunities Identified

1. **Phase 1**: All 3 setup tasks can run in parallel
2. **Phase 2**: Initial type updates (T004, T005) can run in parallel
3. **After US1**: Stories 2, 3, 4, and 5 can all proceed in parallel
4. **Within each story**: Tasks marked [P] can run in parallel
5. **Polish phase**: Cleanup tasks can run in parallel

### Independent Test Criteria Per Story

| User Story | Independent Test Criteria                                                                   |
| ---------- | ------------------------------------------------------------------------------------------- |
| US1        | Verify connection via startup logs; Test connection pool status independently               |
| US2        | Execute command, verify record exists in DB via SQL query; Test INSERT directly against DB  |
| US3        | Insert test data via SQL, run query functions; Test independently without command execution |
| US4        | Start server, make HTTP GET request to endpoint; Test independently with mock data          |
| US5        | Start app, send shutdown signal, verify connection closes cleanly via connection monitoring |

### Suggested MVP Scope

**MVP = User Story 1 Only (Database Connection)**

MVP deliverables:

1. PostgreSQL database schema created
2. PostgreSQLService singleton implemented
3. Database connection established on startup
4. Graceful error handling when DB unavailable
5. Unit tests for core service methods

**Why this MVP?**

- Database connection is fundamental to all other functionality
- Without working connection, no logging or queries can work
- Demonstrates core infrastructure is solid
- Can be tested and deployed independently

**After MVP**, proceed incrementally with US2 → US3 → US4 → US5

---

## Notes

- All SQL queries MUST use parameterized syntax ($1, $2, etc.) to prevent SQL injection
- All ClickHouse references MUST be removed or replaced
- Environment variables MUST migrate from CLICKHOUSE*\* to PG*\*
- Maintain backward compatibility with existing API response formats
- Follow TypeScript strict mode (Constitution Principle II)
- Use singleton pattern for PostgreSQLService (consistent with ClickHouseService)
- All tasks must have exact file paths in descriptions
- Tests are OPTIONAL - only implement if explicitly requested
