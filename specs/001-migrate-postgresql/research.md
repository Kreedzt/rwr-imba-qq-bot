# Research: Migrate from ClickHouse to PostgreSQL

**Feature**: 001-migrate-postgresql
**Date**: 2026-01-29

## Overview

Research findings for migrating command execution logging from ClickHouse to PostgreSQL. Focus on schema design, connection management, query patterns, and performance optimization.

## 1. PostgreSQL Schema Design

### Decision: Use equivalent table structure with PostgreSQL-native types

**Rationale**: Maintain data fidelity while leveraging PostgreSQL's strengths for analytics queries.

**Schema Equivalent to ClickHouse cmd_access_table**:

```sql
CREATE TABLE IF NOT EXISTS cmd_access_table (
    cmd VARCHAR(255) NOT NULL,
    params TEXT,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    received_time TIMESTAMP WITH TIME ZONE NOT NULL,
    response_time TIMESTAMP WITH TIME ZONE NOT NULL,
    elapse_time INTEGER NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for query performance
CREATE INDEX idx_cmd ON cmd_access_table(cmd);
CREATE INDEX idx_user_id ON cmd_access_table(user_id);
CREATE INDEX idx_create_time ON cmd_access_table(create_time);
CREATE INDEX idx_cmd_create_time ON cmd_access_table(cmd, create_time);
CREATE INDEX idx_user_cmd ON cmd_access_table(user_id, cmd);
```

**Type Mapping**:

- ClickHouse `FixedString(255)` → PostgreSQL `VARCHAR(255)`
- ClickHouse `String` → PostgreSQL `TEXT`
- ClickHouse `UInt32` → PostgreSQL `BIGINT` (QQ IDs can exceed 32-bit)
- ClickHouse `DateTime64` → PostgreSQL `TIMESTAMP WITH TIME ZONE`
- ClickHouse `UInt32` (elapse_time) → PostgreSQL `INTEGER`

**Alternatives Considered**:

1. Use JSONB for params → Rejected because ClickHouse stores as string, maintain compatibility
2. Partition by month → Rejected for simplicity, ClickHouse partition by YYYYMM is not needed at this scale
3. Use materialized views → Rejected as premature optimization, indexes sufficient for 10k/day

## 2. pg Package Connection Pooling

### Decision: Use pg.Pool for connection management

**Rationale**: Built-in connection pooling in pg.Pool handles concurrent operations efficiently. Reuse singleton pattern from ClickHouseService.

**Connection Pool Configuration**:

```typescript
import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    max: 50, // Match spec requirement (SC-005)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);
```

**Best Practices**:

- Use parameterized queries (pg automatically escapes values)
- Release clients back to pool after use
- Handle connection errors gracefully
- Close pool on application shutdown
- Use single pool instance per application (singleton pattern)

**Alternatives Considered**:

1. pg-cursor for streaming → Rejected, dataset sizes are small (<10k records)
2. Multiple pools for read/write → Rejected, unnecessary complexity for this scale
3. Connection-per-query → Rejected, poor performance and resource usage

## 3. Parameterized Query Patterns

### Decision: Use $1, $2, $n placeholder syntax

**Rationale**: pg package uses PostgreSQL's native parameter placeholder syntax. Prevents SQL injection automatically.

**Query Examples**:

```typescript
// Insert operation
async insertCmdData(data: CmdData) {
    const query = `
        INSERT INTO cmd_access_table
        (cmd, params, user_id, group_id, received_time, response_time, elapse_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await this.pool.query(query, [
        data.cmd,
        data.params,
        data.user_id,
        data.group_id,
        data.received_time,
        data.response_time,
        data.elapse_time
    ]);
}

// Query with aggregation
async getAllCmdLog() {
    const query = `
        SELECT cmd, COUNT(*) as count
        FROM cmd_access_table
        GROUP BY cmd
        ORDER BY count DESC
        LIMIT 10
    `;
    return this.pool.query(query);
}

// Query with filtering
async getLogByCmd(cmd: string) {
    const query = `
        SELECT params, COUNT(*) as count
        FROM cmd_access_table
        WHERE cmd = $1
        GROUP BY params
        ORDER BY count DESC
        LIMIT 10
    `;
    return this.pool.query(query, [cmd]);
}
```

**Best Practices**:

- Always use parameterized queries for user input
- Explicitly type query parameters
- Use prepared statements for repeated queries (pg caches automatically)
- Handle result rows as typed interfaces

**Alternatives Considered**:

1. Query builders (Knex.js, TypeORM) → Rejected, adds unnecessary dependency overhead
2. String interpolation → Rejected, SQL injection vulnerability
3. pg-promise library → Rejected, adds complexity for simple use case

## 4. Time-Based Query Migration

### Decision: Use PostgreSQL INTERVAL syntax

**Rationale**: PostgreSQL supports INTERVAL arithmetic directly, equivalent to ClickHouse syntax.

**Query Translation**:

```sql
-- ClickHouse
WHERE create_time >= now() - INTERVAL 7 DAY

-- PostgreSQL
WHERE create_time >= NOW() - INTERVAL '7 days'

-- ClickHouse
WHERE create_time >= now() - INTERVAL 30 DAY

-- PostgreSQL
WHERE create_time >= NOW() - INTERVAL '30 days'
```

**Best Practices**:

- Use NOW() for current timestamp
- Use INTERVAL with explicit units ('7 days', '30 days', '1 hour')
- Index create_time column for performance
- Consider time zones (TIMESTAMP WITH TIME ZONE)

**Alternatives Considered**:

1. Use EXTRACT and arithmetic → Rejected, INTERVAL syntax is clearer
2. Store timestamps as UTC only → Rejected, TIMESTAMP WITH TIME ZONE handles conversion
3. Use application-level time filtering → Rejected, database filtering is more efficient

## 5. Performance Optimization

### Decision: Use indexes and query optimization for <200ms goal

**Rationale**: With proper indexes and optimized queries, PostgreSQL easily handles 10k/day operations with <200ms response times.

**Index Strategy**:

- Index on `cmd` for command-based queries (getAllCmdLog, getLogByCmd)
- Index on `user_id` for user-based queries (getLogByUser)
- Index on `create_time` for time-based filtering (getAllCmdLog7Days, getLogByCmd7Days)
- Composite index on `(cmd, create_time)` for common combined filters
- Composite index on `(user_id, cmd)` for user-command queries

**Query Optimization**:

- Use LIMIT 10 consistently to reduce result set
- Aggregate at database level (GROUP BY, COUNT)
- Avoid SELECT \* (only select needed columns)
- Use EXPLAIN ANALYZE for query performance testing

**Connection Pool Optimization**:

- max: 50 connections (matches spec SC-005)
- idleTimeoutMillis: 30000ms (cleanup unused connections)
- connectionTimeoutMillis: 2000ms (fail fast on connection issues)

**Alternatives Considered**:

1. Partitioning by date → Rejected, unnecessary at 10k/day scale
2. Caching results → Rejected, analytics data is time-sensitive
3. Denormalization → Rejected, table structure is already simple

## 6. Error Handling and Retry Logic

### Decision: Implement exponential backoff for transient failures

**Rationale**: Database connections can fail temporarily; retry logic improves reliability.

**Retry Strategy**:

```typescript
async queryWithRetry(query: string, params: any[], maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await this.pool.query(query, params);
        } catch (error) {
            if (attempt === maxRetries - 1) throw error;
            const delay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms
            await new Promise(resolve => setTimeout(resolve, delay));
            logger.warn(`Query failed, retrying (attempt ${attempt + 1}/${maxRetries})`, { error, query });
        }
    }
}
```

**Error Categories**:

- Transient: Connection timeouts, network issues → Retry with backoff
- Permanent: SQL errors, constraint violations → Log and fail gracefully
- Configuration: Missing credentials, wrong database → Log error and continue without crashing

**Alternatives Considered**:

1. No retry logic → Rejected, reduces reliability
2. Immediate retries → Rejected, can overwhelm database
3. Third-party retry libraries → Rejected, simple implementation sufficient

## 7. Type Safety and Interfaces

### Decision: Define strict TypeScript interfaces for query results

**Rationale**: Maintain TypeScript strict mode (Constitution Principle II) and catch type errors at compile time.

**Type Definitions**:

```typescript
interface CmdData {
    cmd: string;
    params: string;
    user_id: number;
    group_id: number;
    received_time?: Date;
    response_time?: Date;
    elapse_time: number;
}

interface QueryResult<T> {
    rows: T[];
    rowCount: number | null;
}

interface CmdCountResult {
    cmd: string;
    count: bigint;
}

interface LogEntry {
    cmd: string;
    params: string;
    user_id: number;
    group_id: number;
    received_time: Date;
    response_time: Date;
    elapse_time: number;
    create_time: Date;
}
```

**Alternatives Considered**:

1. Use `any` for results → Rejected, violates Constitution Principle II
2. Generate types from schema → Rejected, adds complexity, manual types sufficient
3. Use type guards for runtime validation → Rejected, TypeScript strict mode provides compile-time safety

## Summary of Key Decisions

| Area           | Decision                               | Rationale                  |
| -------------- | -------------------------------------- | -------------------------- |
| Schema         | Equivalent table with PostgreSQL types | Maintain data fidelity     |
| Connection     | pg.Pool with singleton pattern         | Efficient connection reuse |
| Queries        | Parameterized with $1, $2 syntax       | SQL injection prevention   |
| Time filters   | PostgreSQL INTERVAL syntax             | Equivalent to ClickHouse   |
| Performance    | Strategic indexes + LIMIT 10           | Meets <200ms goal          |
| Error handling | Retry with exponential backoff         | Improves reliability       |
| Type safety    | Strict TypeScript interfaces           | Constitution compliance    |

## Open Questions Resolved

None. All technical aspects have been researched and decisions made.
