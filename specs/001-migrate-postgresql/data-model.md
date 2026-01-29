# Data Model: Migrate from ClickHouse to PostgreSQL

**Feature**: 001-migrate-postgresql
**Date**: 2026-01-29

## Overview

Data model for command execution logging system migrated from ClickHouse to PostgreSQL. Maintains existing data structure while leveraging PostgreSQL's capabilities.

## Entities

### CmdAccessTable

Represents a single command execution record.

**Fields**:

| Field         | Type                                            | Description                                  | Constraints             |
| ------------- | ----------------------------------------------- | -------------------------------------------- | ----------------------- |
| cmd           | VARCHAR(255) NOT NULL                           | Command name (e.g., "tdoll", "servers")      | Length ≤ 255 chars      |
| params        | TEXT                                            | Command parameters as space-separated string | Nullable                |
| user_id       | BIGINT NOT NULL                                 | QQ user ID who executed command              | Must be positive        |
| group_id      | BIGINT NOT NULL                                 | QQ group ID where command was executed       | Must be positive        |
| received_time | TIMESTAMP WITH TIME ZONE NOT NULL               | Timestamp when command was received          | Required                |
| response_time | TIMESTAMP WITH TIME ZONE NOT NULL               | Timestamp when response was sent             | Must be ≥ received_time |
| elapse_time   | INTEGER NOT NULL                                | Execution duration in milliseconds           | Must be ≥ 0             |
| create_time   | TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL | Automatic timestamp when record created      | System-generated        |

**Indexes**:

```sql
CREATE INDEX idx_cmd ON cmd_access_table(cmd);
CREATE INDEX idx_user_id ON cmd_access_table(user_id);
CREATE INDEX idx_create_time ON cmd_access_table(create_time);
CREATE INDEX idx_cmd_create_time ON cmd_access_table(cmd, create_time);
CREATE INDEX idx_user_cmd ON cmd_access_table(user_id, cmd);
```

**Validation Rules**:

- `elapse_time` must be non-negative (response_time ≥ received_time)
- `user_id` and `group_id` must be valid QQ numbers (≥ 10000)
- `cmd` must match registered command names
- `params` can be empty string for commands without parameters

### Query Results

#### CmdCountResult

Aggregated command usage count.

**Fields**:

| Field | Type         | Description          |
| ----- | ------------ | -------------------- |
| cmd   | VARCHAR(255) | Command name         |
| count | BIGINT       | Number of executions |

#### ParamsCountResult

Aggregated parameter usage count for specific command.

**Fields**:

| Field  | Type   | Description                                |
| ------ | ------ | ------------------------------------------ |
| params | TEXT   | Parameter combination                      |
| count  | BIGINT | Number of executions with these parameters |

### Service Interfaces

#### PostgreSQLService

Singleton service managing database connection pool and operations.

**Methods**:

```typescript
class PostgreSQLService {
    // Singleton instance
    static getInst(): PostgreSQLService;

    // Execute parameterized query
    query<T>(sql: string, params?: any[]): Promise<QueryResult<T>>;

    // Query command logs with optional custom SQL
    queryCmd(sql?: string): Promise<LogEntry[]>;

    // Insert command execution record
    insertCmdData(data: CmdData): Promise<QueryResult<null>>;

    // Close connection pool (shutdown)
    close(): Promise<void>;
}
```

**State Management**:

- **Initialized**: Singleton instance created, connection pool established
- **Connected**: At least one active connection to PostgreSQL
- **Disconnected**: Connection pool closed, no active connections
- **Error**: Transient or permanent error in connection or query

**Connection Pool State**:

```
┌─────────────────────────────────┐
│  PostgreSQLService (Singleton)  │
│  ┌───────────────────────────┐  │
│  │  pg.Pool                 │  │
│  │  - max: 50               │  │
│  │  - idleTimeout: 30000ms  │  │
│  │  - connTimeout: 2000ms   │  │
│  └───────────────────────────┘  │
│                                 │
│  State: Connected/Disconnected  │
└─────────────────────────────────┘
```

## Data Flow

### Command Execution Logging

```
┌─────────────┐
│ User        │
│ Executes    │
│ Command     │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Command Handler  │
│ (commands/index) │
└──────┬───────────┘
       │
       │ received_time = now()
       │ execute command
       │ response_time = now()
       │ elapse_time = diff
       ▼
┌─────────────────────┐
│ PostgreSQLService   │
│ .insertCmdData()    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ cmd_access_table    │
│ (PostgreSQL)        │
└─────────────────────┘
```

### Query Statistics

```
┌─────────────┐
│ User        │
│ Queries     │
│ #log all    │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Log Command      │
│ (commands/log)   │
└──────┬───────────┘
       │
       ▼
┌─────────────────────┐
│ PostgreSQLService   │
│ .queryCmd()         │
└──────┬──────────────┘
       │
       │ SELECT cmd, COUNT(*)
       │ FROM cmd_access_table
       │ GROUP BY cmd
       │ LIMIT 10
       ▼
┌─────────────────────┐
│ PostgreSQL         │
│ (Execute Query)    │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│ Return      │
│ Results     │
└─────────────┘
```

## Relationships

### No Foreign Keys

This is a logging table with no relationships to other tables. Data is appended via command execution events.

### Historical Data

- Records are never updated or deleted
- create_time is immutable (set at INSERT time)
- Data grows linearly with command usage
- No archival strategy specified (assumption: all data retained)

## Query Patterns

### 1. All Commands Statistics

```sql
SELECT cmd, COUNT(*) as count
FROM cmd_access_table
GROUP BY cmd
ORDER BY count DESC
LIMIT 10
```

**Uses Index**: `idx_cmd`

### 2. Specific Command Parameters

```sql
SELECT params, COUNT(*) as count
FROM cmd_access_table
WHERE cmd = $1
GROUP BY params
ORDER BY count DESC
LIMIT 10
```

**Uses Index**: `idx_cmd`

### 3. User Statistics

```sql
SELECT cmd, COUNT(*) as count
FROM cmd_access_table
WHERE user_id = $1
GROUP BY cmd
ORDER BY count DESC
LIMIT 10
```

**Uses Index**: `idx_user_id`

### 4. User + Command Statistics

```sql
SELECT params, COUNT(*) as count
FROM cmd_access_table
WHERE user_id = $1 AND cmd = $2
GROUP BY params
ORDER BY count DESC
LIMIT 10
```

**Uses Index**: `idx_user_cmd`

### 5. Time-Filtered Queries (Last 7 Days)

```sql
SELECT cmd, COUNT(*) as count
FROM cmd_access_table
WHERE create_time >= NOW() - INTERVAL '7 days'
GROUP BY cmd
ORDER BY count DESC
LIMIT 10
```

**Uses Index**: `idx_create_time` (or `idx_cmd_create_time` with command filter)

## Data Volume Estimates

Based on spec assumptions:

- **Growth Rate**: ~10,000 commands per day
- **Annual Volume**: ~3.65 million records
- **Record Size**: ~200 bytes per record (estimated)
- **Storage**: ~730 MB per year (uncompressed)
- **Index Overhead**: ~2-3x data size = ~2.2 GB per year

**Retention**: No archival specified (assumption: all data retained)

## Migration Notes

### Schema Migration from ClickHouse

**ClickHouse**:

```sql
CREATE TABLE cmd_access_table (
  cmd FixedString(255),
  params String,
  group_id UInt32,
  user_id UInt32,
  received_time DateTime64 DEFAULT now(),
  response_time DateTime64 DEFAULT now(),
  elapse_time UInt32 DEFAULT 0,
  create_time DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(create_time)
ORDER BY (cmd, create_time)
```

**PostgreSQL**:

```sql
CREATE TABLE cmd_access_table (
    cmd VARCHAR(255) NOT NULL,
    params TEXT,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    received_time TIMESTAMP WITH TIME ZONE NOT NULL,
    response_time TIMESTAMP WITH TIME ZONE NOT NULL,
    elapse_time INTEGER NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_cmd ON cmd_access_table(cmd);
CREATE INDEX idx_user_id ON cmd_access_table(user_id);
CREATE INDEX idx_create_time ON cmd_access_table(create_time);
CREATE INDEX idx_cmd_create_time ON cmd_access_table(cmd, create_time);
CREATE INDEX idx_user_cmd ON cmd_access_table(user_id, cmd);
```

**Key Differences**:

1. FixedString → VARCHAR (PostgreSQL has equivalent length limits)
2. UInt32 → BIGINT (QQ IDs can exceed 32-bit)
3. DateTime64 → TIMESTAMP WITH TIME ZONE (PostgreSQL has time zone support)
4. No partitioning (unnecessary at 10k/day scale)
5. No engine specification (PostgreSQL uses MVCC automatically)

### Data Migration (if needed)

If existing ClickHouse data needs migration:

```sql
-- Export from ClickHouse (clickhouse-client)
clickhouse-client --query "SELECT * FROM cmd_access_table FORMAT CSVWithNames" > logs.csv

-- Import to PostgreSQL (psql)
psql -c "\COPY cmd_access_table FROM 'logs.csv' CSV HEADER"
```

**Note**: Spec assumes fresh database or separate migration effort (see Assumptions section).
