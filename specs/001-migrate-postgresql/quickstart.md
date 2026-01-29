# Quickstart: Migrate from ClickHouse to PostgreSQL

**Feature**: 001-migrate-postgresql
**Date**: 2026-01-29

## Overview

This guide helps you set up and test the PostgreSQL migration for command execution logging.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 22.11.0
- pnpm (package manager)
- Database user with CREATE TABLE and CRUD permissions

## Step 1: Database Setup

### 1.1 Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE rwr_imba_bot_db;

# Create user (optional, if not using postgres user)
CREATE USER rwr_imba_bot WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE rwr_imba_bot_db TO rwr_imba_bot;
```

### 1.2 Initialize Schema

Run the SQL script to create the table:

```bash
psql -U rwr_imba_bot -d rwr_imba_bot_db -f init.sql
```

Or manually execute:

```sql
-- Connect to database
\c rwr_imba_bot_db

-- Create table
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

-- Create indexes
CREATE INDEX idx_cmd ON cmd_access_table(cmd);
CREATE INDEX idx_user_id ON cmd_access_table(user_id);
CREATE INDEX idx_create_time ON cmd_access_table(create_time);
CREATE INDEX idx_cmd_create_time ON cmd_access_table(cmd, create_time);
CREATE INDEX idx_user_cmd ON cmd_access_table(user_id, cmd);
```

Verify table creation:

```sql
\dt cmd_access_table
\d cmd_access_table
```

## Step 2: Environment Configuration

### 2.1 Update Environment Variables

Create or update `.env` file:

```bash
# PostgreSQL configuration (NEW)
PG_HOST=localhost
PG_PORT=5432
PG_DB=rwr_imba_bot_db
PG_USER=rwr_imba_bot
PG_PASSWORD=your_password

# ClickHouse configuration (REMOVE)
# CLICKHOUSE_HOST=...
# CLICKHOUSE_DB=...
# CLICKHOUSE_USER=...
# CLICKHOUSE_PASSWORD=...
```

### 2.2 Update Type Definitions

The `GlobalEnv` interface in `src/types.ts` will be updated to include PostgreSQL variables:

```typescript
export interface GlobalEnv {
    // ... existing variables ...
    PG_HOST?: string;
    PG_PORT?: string;
    PG_DB?: string;
    PG_USER?: string;
    PG_PASSWORD?: string;
}
```

## Step 3: Installation

### 3.1 Install Dependencies

The `pg` package should already be installed. If not:

```bash
pnpm install pg
```

### 3.2 Install TypeScript Types

```bash
pnpm install -D @types/pg
```

## Step 4: Code Changes

### 4.1 Create PostgreSQL Service

Create `src/services/postgresql.service.ts`:

```typescript
import { Pool, PoolConfig, QueryResult as PgQueryResult } from 'pg';
import { logger } from '../utils/logger';

const CMD_ACCESS_TABLE = 'cmd_access_table';
const QUERY_CMD_ACCESS = `SELECT * FROM ${CMD_ACCESS_TABLE}`;

export class PostgreSQLService {
    static inst: PostgreSQLService;
    private pool: Pool;

    constructor() {
        const config: PoolConfig = {
            host: process.env.PG_HOST,
            port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
            database: process.env.PG_DB,
            user: process.env.PG_USER,
            password: process.env.PG_PASSWORD,
            max: 50,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };
        this.pool = new Pool(config);
        this.pool.on('error', (err) => {
            logger.error('PostgreSQL pool error', err);
        });
    }

    async query<T>(sql: string, params?: any[]): Promise<PgQueryResult<T>> {
        return this.pool.query(sql, params);
    }

    async queryCmd(sql?: string): Promise<any[]> {
        logger.info('queryCmd', sql);
        const queryRes = await this.pool.query(sql ?? QUERY_CMD_ACCESS);
        logger.info('queryCmd OK', queryRes.rows);
        return queryRes.rows;
    }

    async insertCmdData(data: {
        cmd: string;
        params: string;
        user_id: number;
        group_id: number;
        received_time?: Date;
        response_time?: Date;
        elapse_time: number;
    }) {
        logger.info('insertCmdData', data);
        const query = `
            INSERT INTO ${CMD_ACCESS_TABLE}
            (cmd, params, user_id, group_id, received_time, response_time, elapse_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const res = await this.pool.query(query, [
            data.cmd,
            data.params,
            data.user_id,
            data.group_id,
            data.received_time || new Date(),
            data.response_time || new Date(),
            data.elapse_time,
        ]);
        logger.info('insertCmdData OK');
        return res;
    }

    static getInst(): PostgreSQLService {
        if (!PostgreSQLService.inst) {
            PostgreSQLService.inst = new PostgreSQLService();
        }
        return PostgreSQLService.inst;
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}
```

### 4.2 Update Commands/Log (db.ts)

Replace `ClickHouseService` with `PostgreSQLService`:

```typescript
// Before
import { ClickHouseService } from '../../services/clickHouse.service';

// After
import { PostgreSQLService } from '../../services/postgresql.service';

export const getAllCmdLog = async () => {
    const res = await PostgreSQLService.getInst().queryCmd(
        `SELECT cmd, COUNT(*) as count FROM cmd_access_table GROUP BY cmd ORDER BY count DESC LIMIT 10`,
    );
    return res;
};

export const getLogByCmd = async (cmd: string) => {
    const res = await PostgreSQLService.getInst().queryCmd(
        `SELECT params, COUNT(*) as count FROM cmd_access_table WHERE cmd = $1 GROUP BY params ORDER BY count DESC LIMIT 10`,
        [cmd],
    );
    return res;
};

export const getLogByUser = async (userId: number) => {
    const res = await PostgreSQLService.getInst().queryCmd(
        `SELECT cmd, COUNT(*) as count FROM cmd_access_table WHERE user_id = $1 GROUP BY cmd ORDER BY count DESC LIMIT 10`,
        [userId],
    );
    return res;
};

export const getLogByCmdAndUser = async (userId: number, cmd: string) => {
    const res = await PostgreSQLService.getInst().queryCmd(
        `SELECT params, COUNT(*) as count FROM cmd_access_table WHERE user_id = $1 AND cmd = $2 GROUP BY params ORDER BY count DESC LIMIT 10`,
        [userId, cmd],
    );
    return res;
};

export const getAllCmdLog7Days = async () => {
    const res = await PostgreSQLService.getInst().queryCmd(
        `SELECT cmd, COUNT(*) as count FROM cmd_access_table WHERE create_time >= NOW() - INTERVAL '7 days' GROUP BY cmd ORDER BY count DESC LIMIT 10`,
    );
    return res;
};

export const getLogByCmd7Days = async (cmd: string) => {
    const res = await PostgreSQLService.getInst().queryCmd(
        `SELECT params, COUNT(*) as count FROM cmd_access_table WHERE cmd = $1 AND create_time >= NOW() - INTERVAL '7 days' GROUP BY params ORDER BY count DESC LIMIT 10`,
        [cmd],
    );
    return res;
};
```

### 4.3 Update Commands/Index.ts

Replace ClickHouse insert with PostgreSQL:

```typescript
// Before
import { ClickHouseService } from '../services/clickHouse.service';

// After
import { PostgreSQLService } from '../services/postgresql.service';

// In msgHandler function, replace:
if (process.env.CLICKHOUSE_HOST) {
    ClickHouseService.getInst()
        .insertCmdData({...})
        .catch((err) => {
            logger.error('insertCmdData error', err);
        });
}

// With:
if (process.env.PG_HOST) {
    PostgreSQLService.getInst()
        .insertCmdData({...})
        .catch((err) => {
            logger.error('insertCmdData error', err);
        });
}
```

### 4.4 Update Routes.ts

Replace environment variable check:

```typescript
// Before
if (process.env.CLICKHOUSE_DB) {
    app.get('/query_cmd', async (req, res) => {
        const data = await ClickHouseService.getInst().queryCmd();
        // ...
    });
}

// After
if (process.env.PG_DB) {
    app.get('/query_cmd', async (req, res) => {
        const data = await PostgreSQLService.getInst().queryCmd();
        // ...
    });
}
```

### 4.5 Update Shutdown.ts

Replace close call:

```typescript
// Before
if (process.env.CLICKHOUSE_DB) {
    await ClickHouseService.getInst().close();
}

// After
if (process.env.PG_DB) {
    await PostgreSQLService.getInst().close();
}
```

### 4.6 Delete Old Files

Remove ClickHouse service:

```bash
rm src/services/clickHouse.service.ts
```

## Step 5: Testing

### 5.1 Unit Tests

Create `tests/unit/services/postgresql.service.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { PostgreSQLService } from '../../../src/services/postgresql.service';

describe('PostgreSQLService', () => {
    let service: PostgreSQLService;

    beforeEach(() => {
        service = PostgreSQLService.getInst();
    });

    afterEach(async () => {
        // Clean up test data
        await service.query('DELETE FROM cmd_access_table');
    });

    test('getInst returns singleton', () => {
        const service2 = PostgreSQLService.getInst();
        expect(service).toBe(service2);
    });

    test('insertCmdData inserts record', async () => {
        await service.insertCmdData({
            cmd: 'test',
            params: 'param1',
            user_id: 123456,
            group_id: 789012,
            elapse_time: 100,
        });

        const result = await service.query(
            'SELECT * FROM cmd_access_table WHERE cmd = $1',
            ['test'],
        );
        expect(result.rowCount).toBe(1);
        expect(result.rows[0].cmd).toBe('test');
    });

    test('queryCmd returns log entries', async () => {
        await service.insertCmdData({
            cmd: 'test',
            params: 'param1',
            user_id: 123456,
            group_id: 789012,
            elapse_time: 100,
        });

        const logs = await service.queryCmd();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0].cmd).toBe('test');
    });
});
```

Run unit tests:

```bash
pnpm test tests/unit/services/postgresql.service.test.ts
```

### 5.2 Integration Tests

Create `tests/integration/database.test.ts`:

```bash
# Create test database
createdb rwr_imba_bot_test

# Run tests with test database
PG_DB=rwr_imba_bot_test pnpm test tests/integration/database.test.ts
```

### 5.3 Manual Testing

1. **Start the bot**:

```bash
pnpm start
```

2. **Execute a command** (e.g., `#tdoll m4a1`)

3. **Check database**:

```sql
SELECT * FROM cmd_access_table ORDER BY create_time DESC LIMIT 5;
```

4. **Query HTTP endpoint**:

```bash
curl http://localhost:8080/query_cmd
```

5. **Test log command**:

```
#log all
#log tdoll
#log7 tdoll
```

## Step 6: Verification

### 6.1 Performance Checks

Verify SLA requirements:

```sql
-- Test query performance
EXPLAIN ANALYZE SELECT cmd, COUNT(*) FROM cmd_access_table GROUP BY cmd LIMIT 10;

-- Should complete in < 200ms for 10k records
```

### 6.2 Connection Pool

Check pool status (add logging to PostgreSQLService):

```typescript
logger.info('Pool status', {
    totalCount: this.pool.totalCount,
    idleCount: this.pool.idleCount,
    waitingCount: this.pool.waitingCount,
});
```

### 6.3 Error Handling

Test error scenarios:

1. **Database unavailable**: Stop PostgreSQL, execute command, should see error log but bot continues
2. **Invalid connection**: Set wrong password, should fail gracefully
3. **SQL injection**: Try malicious params, should be rejected

## Step 7: Deployment

### 7.1 Docker Configuration

Update Docker environment:

```dockerfile
# Remove ClickHouse variables
# -e "CLICKHOUSE_HOST=..."

# Add PostgreSQL variables
-e "PG_HOST=postgres"
-e "PG_DB=rwr_imba_bot_db"
-e "PG_USER=rwr_imba_bot"
-e "PG_PASSWORD=your_password"
```

### 7.2 Database Migration (if needed)

If migrating existing ClickHouse data:

```bash
# Export from ClickHouse
clickhouse-client --query "SELECT * FROM cmd_access_table FORMAT CSVWithNames" > logs.csv

# Import to PostgreSQL
psql -U rwr_imba_bot -d rwr_imba_bot_db -c "\COPY cmd_access_table FROM 'logs.csv' CSV HEADER"
```

### 7.3 Monitoring

Set up monitoring:

1. **Connection pool health**: Monitor `pg_stat_activity`
2. **Query performance**: Monitor `pg_stat_statements`
3. **Table size**: Monitor `pg_class.relpages`
4. **Index usage**: Monitor `pg_stat_user_indexes`

## Troubleshooting

### Common Issues

**Issue**: Connection refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Check PostgreSQL is running and PG_HOST/PG_PORT are correct.

**Issue**: Database does not exist

```
Error: database "rwr_imba_bot_db" does not exist
```

**Solution**: Create database or set correct PG_DB.

**Issue**: Permission denied

```
Error: permission denied for table cmd_access_table
```

**Solution**: Grant privileges to PG_USER.

**Issue**: Connection pool exhausted

```
Error: Timeout acquiring connection from pool
```

**Solution**: Increase pool max size or check for connection leaks.

## Next Steps

1. ✅ Database setup complete
2. ✅ Environment configured
3. ✅ Code changes implemented
4. ✅ Tests passing
5. ✅ Manual verification successful
6. 🔄 Deploy to production
7. 🔄 Monitor performance
8. 🔄 Remove old ClickHouse code (after production verification)

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg package documentation](https://node-postgres.com/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
