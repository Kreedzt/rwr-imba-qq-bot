# API Contracts: Migrate from ClickHouse to PostgreSQL

**Feature**: 001-migrate-postgresql
**Date**: 2026-01-29

## Overview

API contracts for PostgreSQL service and HTTP endpoint. Maintains backward compatibility with existing ClickHouse API contract.

## TypeScript Service Interface

### PostgreSQLService

**File**: `src/services/postgresql.service.ts`

```typescript
/**
 * PostgreSQL service for command execution logging
 * Singleton pattern - use PostgreSQLService.getInst()
 */
export class PostgreSQLService {
    private static inst: PostgreSQLService;
    private pool: Pool;

    private constructor(config: PoolConfig);

    /**
     * Get singleton instance
     * @returns PostgreSQLService instance
     */
    static getInst(): PostgreSQLService;

    /**
     * Execute parameterized query
     * @param sql - SQL query string with $1, $2, ... placeholders
     * @param params - Query parameters (optional)
     * @returns Query result with typed rows
     */
    query<T>(sql: string, params?: any[]): Promise<QueryResult<T>>;

    /**
     * Query command logs (default or custom SQL)
     * @param sql - Optional custom SQL query (default: SELECT all)
     * @returns Array of log entries
     */
    queryCmd(sql?: string): Promise<LogEntry[]>;

    /**
     * Insert command execution record
     * @param data - Command data to insert
     * @returns Query result
     */
    insertCmdData(data: CmdData): Promise<QueryResult<null>>;

    /**
     * Close connection pool
     * @returns Promise resolved when pool is closed
     */
    close(): Promise<void>;
}
```

### Type Definitions

```typescript
/**
 * Command execution data for insertion
 */
interface CmdData {
    cmd: string;
    params: string;
    user_id: number;
    group_id: number;
    received_time?: Date;
    response_time?: Date;
    elapse_time: number;
}

/**
 * Generic query result
 */
interface QueryResult<T> {
    rows: T[];
    rowCount: number | null;
    command: string;
    fields: Field[];
}

/**
 * Command count result
 */
interface CmdCountResult {
    cmd: string;
    count: bigint;
}

/**
 * Parameter count result
 */
interface ParamsCountResult {
    params: string;
    count: bigint;
}

/**
 * Full log entry
 */
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

/**
 * PostgreSQL field metadata
 */
interface Field {
    name: string;
    tableID: number;
    columnID: number;
    dataTypeID: number;
    dataTypeSize: number;
    dataTypeModifier: number;
    format: string;
}
```

## Database Query Functions

### File: `src/commands/log/db.ts`

```typescript
/**
 * Get all command usage statistics (top 10)
 * @returns Array of command counts
 */
export const getAllCmdLog = async (): Promise<CmdCountResult[]>;

/**
 * Get parameter statistics for specific command (top 10)
 * @param cmd - Command name
 * @returns Array of parameter counts
 */
export const getLogByCmd = async (cmd: string): Promise<ParamsCountResult[]>;

/**
 * Get command statistics for specific user (top 10)
 * @param userId - QQ user ID
 * @returns Array of command counts
 */
export const getLogByUser = async (userId: number): Promise<CmdCountResult[]>;

/**
 * Get parameter statistics for specific command and user (top 10)
 * @param userId - QQ user ID
 * @param cmd - Command name
 * @returns Array of parameter counts
 */
export const getLogByCmdAndUser = async (
    userId: number,
    cmd: string
): Promise<ParamsCountResult[]>;

/**
 * Get all command statistics for last 7 days (top 10)
 * @returns Array of command counts
 */
export const getAllCmdLog7Days = async (): Promise<CmdCountResult[]>;

/**
 * Get parameter statistics for specific command in last 7 days (top 10)
 * @param cmd - Command name
 * @returns Array of parameter counts
 */
export const getLogByCmd7Days = async (cmd: string): Promise<ParamsCountResult[]>;
```

## HTTP API Contract

### GET /query_cmd

**Purpose**: Retrieve all command execution logs in tabular format

**Authentication**: None (internal monitoring endpoint)

**Request**:

```http
GET /query_cmd HTTP/1.1
Host: localhost:8080
```

**Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

**Body Format** (2D array - header row + data rows):

```json
[
    [
        "cmd",
        "params",
        "group_id",
        "user_id",
        "received_time",
        "response_time",
        "elapse_time",
        "create_time"
    ],
    [
        "tdoll",
        "m4a1",
        123456789,
        987654321,
        "2026-01-29T10:30:00.000Z",
        "2026-01-29T10:30:05.000Z",
        5234,
        "2026-01-29T10:30:05.000Z"
    ],
    [
        "servers",
        "",
        123456789,
        987654321,
        "2026-01-29T10:31:00.000Z",
        "2026-01-29T10:31:01.000Z",
        1234,
        "2026-01-29T10:31:01.000Z"
    ]
]
```

**Response Codes**:

| Code | Description                                        |
| ---- | -------------------------------------------------- |
| 200  | Success - returns logs (empty array if no logs)    |
| 500  | Internal server error - database connection failed |

**Error Response**:

```json
{
    "error": "Database connection failed",
    "message": "Error details..."
}
```

**Implementation Notes**:

- Only enabled when PG_DB environment variable is set
- Returns all records (no pagination)
- Timestamps formatted as ISO 8601 strings
- Maintains same response format as ClickHouse version

## Environment Variables

### Database Configuration

```typescript
interface PostgreSQLEnv {
    PG_HOST?: string; // PostgreSQL host (required for database feature)
    PG_DB?: string; // PostgreSQL database name (required for database feature)
    PG_USER?: string; // PostgreSQL username (required for database feature)
    PG_PASSWORD?: string; // PostgreSQL password (required for database feature)
}
```

**Legacy Variables** (to be removed):

```typescript
interface ClickHouseEnv {
    CLICKHOUSE_HOST?: string;
    CLICKHOUSE_DB?: string;
    CLICKHOUSE_USER?: string;
    CLICKHOUSE_PASSWORD?: string;
}
```

**Migration**: Replace CLICKHOUSE*\* with PG*\* throughout codebase

## Database Schema Contract

### Table: cmd_access_table

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
```

**Indexes**:

```sql
CREATE INDEX idx_cmd ON cmd_access_table(cmd);
CREATE INDEX idx_user_id ON cmd_access_table(user_id);
CREATE INDEX idx_create_time ON cmd_access_table(create_time);
CREATE INDEX idx_cmd_create_time ON cmd_access_table(cmd, create_time);
CREATE INDEX idx_user_cmd ON cmd_access_table(user_id, cmd);
```

## Backward Compatibility

### API Contract Compatibility

The HTTP endpoint `/query_cmd` maintains exact same response format:

1. **Response Structure**: 2D array (headers + rows)
2. **Column Order**: cmd, params, group_id, user_id, received_time, response_time, elapse_time, create_time
3. **Data Types**: String format for all fields (timestamp as ISO 8601)
4. **Error Handling**: Same error response format

### TypeScript Interface Compatibility

Service interface mirrors ClickHouseService:

1. **Method Names**: Same (queryCmd, insertCmdData, close)
2. **Return Types**: Same (Promise with typed results)
3. **Singleton Pattern**: Same (getInst())
4. **Error Handling**: Same (throw on errors, caller catches)

### Migration Path

```typescript
// Before (ClickHouse)
import { ClickHouseService } from '../services/clickHouse.service';
const data = await ClickHouseService.getInst().queryCmd();

// After (PostgreSQL)
import { PostgreSQLService } from '../services/postgresql.service';
const data = await PostgreSQLService.getInst().queryCmd();
```

**Note**: Only import path changes. All method calls remain identical.

## Performance Contracts

### SLA Guarantees

Based on spec success criteria:

| Operation                       | SLA     | Notes                                      |
| ------------------------------- | ------- | ------------------------------------------ |
| Command logging (insertCmdData) | < 100ms | Measured after command execution completes |
| Query operations (queryCmd)     | < 200ms | For datasets up to 10,000 records          |
| HTTP endpoint response          | < 500ms | Typical query loads                        |
| Database uptime                 | 99.9%   | Normal operation                           |
| Concurrent operations           | 50+     | Connection pool capacity                   |
| Recovery from outage            | < 30s   | Automatic reconnection                     |

### Connection Pool Contract

```typescript
interface PoolConfig {
    max: number; // Max connections: 50
    idleTimeoutMillis: number; // Idle connection timeout: 30000
    connectionTimeoutMillis: number; // Connection timeout: 2000
}
```

**Behavior**:

- Connections acquired on-demand
- Idle connections released after 30s
- Failed connections retry with exponential backoff
- Pool shutdown closes all connections

## Error Handling Contract

### Retry Strategy

```typescript
interface RetryConfig {
    maxRetries: number; // Default: 3
    initialDelay: number; // Default: 100ms
    backoffFactor: number; // Default: 2 (exponential)
}
```

**Retry Logic**:

- Transient errors (connection timeout, network issue) → Retry
- Permanent errors (SQL syntax, constraint violation) → Fail immediately
- Exponential backoff: 100ms, 200ms, 400ms

### Error Types

```typescript
type DatabaseError =
    | { type: 'connection'; message: string; retryable: true }
    | { type: 'query'; message: string; retryable: false }
    | { type: 'timeout'; message: string; retryable: true }
    | { type: 'constraint'; message: string; retryable: false };
```

## Testing Contracts

### Unit Tests

**File**: `tests/unit/services/postgresql.service.test.ts`

```typescript
describe('PostgreSQLService', () => {
    test('getInst returns singleton instance');
    test('query executes parameterized query');
    test('queryCmd returns log entries');
    test('insertCmdData inserts record');
    test('close closes connection pool');
    test('handles connection errors gracefully');
    test('retries on transient failures');
});
```

### Integration Tests

**File**: `tests/integration/database.test.ts`

```typescript
describe('Database Integration', () => {
    test('insert and retrieve command log');
    test('query aggregation functions');
    test('time-based filtering');
    test('concurrent operations');
    test('connection pool recovery');
});
```

### Contract Tests

**File**: `tests/contract/api.test.ts`

```typescript
describe('HTTP API Contract', () => {
    test('GET /query_cmd returns correct format');
    test('response maintains column order');
    test('timestamps are ISO 8601 formatted');
    test('error responses follow contract');
    test('empty result returns headers only');
});
```
