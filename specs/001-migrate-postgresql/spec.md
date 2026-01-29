# Feature Specification: Migrate from ClickHouse to PostgreSQL

**Feature Branch**: `001-migrate-postgresql`
**Created**: 2026-01-29
**Status**: Draft
**Input**: User description: "我们现在期望替换 CLICKHOUSE 数据库的变量配置, 使用 PostGresql 进行替换, 目前我已经安装了 pg 包. 注意写法和连接方法都要替换(连接/查询/插入)"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Establish PostgreSQL Database Connection (Priority: P1)

System establishes and maintains a persistent connection to PostgreSQL database for storing and retrieving command execution logs.

**Why this priority**: Database connection is fundamental to all logging functionality. Without a working connection, no other features can operate.

**Independent Test**: Connection can be verified by checking system initialization logs and testing database connectivity independently of other features.

**Acceptance Scenarios**:

1. **Given** PostgreSQL database is available, **When** system starts, **Then** connection is established successfully
2. **Given** valid database credentials, **When** system attempts to connect, **Then** connection is maintained throughout application lifecycle
3. **Given** database connection fails, **When** system starts, **Then** system logs error and continues operation without crashing

---

### User Story 2 - Log Command Executions to PostgreSQL (Priority: P1)

System automatically records every command execution including command name, parameters, user/group IDs, timing information, and response duration.

**Why this priority**: Command logging is the core analytics feature. All other features depend on this data being captured.

**Independent Test**: Can be tested by executing commands and verifying records are inserted into database, independent of querying capabilities.

**Acceptance Scenarios**:

1. **Given** a command is executed, **When** execution completes, **Then** all command metadata is stored in PostgreSQL
2. **Given** command execution fails, **When** error occurs, **Then** partial execution data (received_time, cmd, params) is still logged
3. **Given** database is unavailable, **When** command executes, **Then** system continues operation and logs connection error without interrupting user experience

---

### User Story 3 - Query Command Statistics (Priority: P2)

Users can query command statistics including overall command usage, parameter usage patterns, per-user statistics, and time-based analytics.

**Why this priority**: Statistics provide insights into system usage patterns. Important but secondary to data collection.

**Independent Test**: Query functionality can be tested with sample data inserted via Story 2, without requiring real command executions.

**Acceptance Scenarios**:

1. **Given** command logs exist, **When** user queries all commands, **Then** system returns top 10 most used commands with counts
2. **Given** specific command logs, **When** user queries by command name, **Then** system returns top 10 parameter combinations with usage counts
3. **Given** user-specific logs, **When** user queries by user ID, **Then** system returns top 10 commands used by that user
4. **Given** time-filtered queries, **When** user queries last 7 days, **Then** system returns statistics filtered by date range

---

### User Story 4 - HTTP Endpoint for Log Access (Priority: P2)

System provides HTTP endpoint for external access to command execution logs in tabular format.

**Why this priority**: External monitoring and analysis tools need programmatic access to log data. Important for observability.

**Independent Test**: Can be tested independently via HTTP client requests, separate from command execution.

**Acceptance Scenarios**:

1. **Given** logs exist in database, **When** HTTP GET request is made to endpoint, **Then** response contains all log records in tabular format
2. **Given** no logs exist, **When** HTTP GET request is made, **Then** response returns empty table with headers only
3. **Given** database connection is unavailable, **When** HTTP GET request is made, **Then** appropriate error response is returned

---

### User Story 5 - Graceful Connection Closure (Priority: P3)

System properly closes database connection and releases resources during shutdown.

**Why this priority**: Important for clean application shutdown and resource management, but does not impact core functionality.

**Independent Test**: Can be tested by triggering shutdown signals and verifying connection is closed gracefully.

**Acceptance Scenarios**:

1. **Given** application is running with active database connection, **When** shutdown signal is received, **Then** database connection is closed cleanly
2. **Given** pending database operations, **When** shutdown is initiated, **Then** system allows current operations to complete before closing connection

---

### Edge Cases

- What happens when PostgreSQL schema does not match expected table structure?
- How does system handle SQL injection attempts in query parameters?
- What happens when database connection is lost during operation?
- How does system handle malformed data types in query results?
- What happens when database connection pool is exhausted?
- How does system handle concurrent write operations to the same table?
- What happens when database server version is incompatible?
- How does system handle timezone differences in timestamp fields?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST establish connection to PostgreSQL database using provided connection parameters
- **FR-002**: System MUST create table structure equivalent to ClickHouse's cmd_access_table if not present
- **FR-003**: System MUST store command execution records including: command name, parameters, group ID, user ID, received timestamp, response timestamp, and execution duration
- **FR-004**: System MUST support querying command statistics aggregated by command name, parameters, and user ID
- **FR-005**: System MUST support time-based filtering of queries (e.g., last 7 days)
- **FR-006**: System MUST return query results in consistent JSON format matching existing API contract
- **FR-007**: System MUST handle database connection failures gracefully without crashing application
- **FR-008**: System MUST provide HTTP endpoint for accessing all command log records
- **FR-009**: System MUST close database connection properly during application shutdown
- **FR-010**: System MUST support concurrent read and write operations to the database
- **FR-011**: System MUST use parameterized queries to prevent SQL injection
- **FR-012**: System MUST replace all ClickHouse environment variables with PostgreSQL equivalents (PG_HOST, PG_DB, PG_USER, PG_PASSWORD)
- **FR-013**: System MUST maintain backwards compatibility with existing query result formats expected by frontend

### Key Entities

- **Command Log Entry**: Represents a single command execution containing command name, parameters, group ID, user ID, received time, response time, execution duration, and creation timestamp
- **Database Connection**: Manages persistent connection pool to PostgreSQL database for all read/write operations
- **Query Result**: Aggregated statistics containing command/parameter/user counts and usage patterns

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All existing ClickHouse references are replaced with PostgreSQL equivalents without breaking existing functionality
- **SC-002**: Command logging operations complete within 100ms after command execution completes
- **SC-003**: Query operations for statistics return results within 200ms for datasets up to 10,000 records
- **SC-004**: System maintains 99.9% uptime for database connectivity during normal operation
- **SC-005**: Database connection pool handles at least 50 concurrent operations without degradation
- **SC-006**: All HTTP endpoints return responses within 500ms for typical query loads
- **SC-007**: System successfully recovers from temporary database outages within 30 seconds
- **SC-008**: All command execution data is accurately captured and stored with 100% data integrity
- **SC-009**: Query results match expected counts with zero discrepancies between frontend display and database records
- **SC-010**: Application shuts down cleanly with database connection closed within 5 seconds of termination signal

## Assumptions

- PostgreSQL database is already installed and accessible
- PostgreSQL version supports required features (JSON functions, window functions)
- Database credentials are provided via environment variables
- Existing ClickHouse data migration is not required (fresh database or separate migration effort)
- Database user has sufficient permissions to create tables and perform CRUD operations
- Network connectivity to PostgreSQL server is reliable and has sufficient bandwidth
- Application continues normal operation if database is temporarily unavailable
