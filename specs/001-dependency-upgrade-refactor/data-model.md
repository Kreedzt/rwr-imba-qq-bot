# Data Model: Dependency Upgrade and Code Cleanup Refactor

**Feature**: 001-dependency-upgrade-refactor
**Phase**: 1 - Design & Contracts
**Date**: 2025-01-27

## Overview

This document defines the data entities involved in dependency management and upgrade processes. Since this is a maintenance feature focused on existing code, these entities represent conceptual models for tracking and managing dependencies rather than persistent database entities.

## Entities

### Dependency

Represents a software package installed from npm registry.

**Fields**:

| Field                 | Type         | Description                                               | Validation                              |
| --------------------- | ------------ | --------------------------------------------------------- | --------------------------------------- |
| name                  | string       | Package name (e.g., "axios", "fastify")                   | Required, valid npm package name format |
| version               | string       | Current installed version (e.g., "1.6.2")                 | Required, valid semver format           |
| latestVersion         | string       | Latest available version (e.g., "1.13.3")                 | Required, valid semver format           |
| wantedVersion         | string       | Version that satisfies package.json range (e.g., "1.6.2") | Required, valid semver format           |
| type                  | enum         | "production" \| "development" \| "transitive"             | Required                                |
| isVulnerable          | boolean      | Whether package has security vulnerabilities              | Required                                |
| vulnerabilitySeverity | enum \| null | "critical" \| "high" \| "moderate" \| "low" \| null       | Optional, null if not vulnerable        |
| isOutdated            | boolean      | Whether package is outdated (current < latest)            | Required                                |
| isUnused              | boolean      | Whether package is imported/used in codebase              | Required                                |
| dependencies          | Dependency[] | Transitive dependencies of this package                   | Optional                                |

**Relationships**:

- A Dependency can have multiple Dependency children (transitive dependencies)
- A Dependency can be referenced by multiple Vulnerability instances

**State Transitions**:

```
[Current] --update--> [Outdated]
[Current] --security advisory--> [Vulnerable]
[Outdated] --update--> [Current]
[Vulnerable] --patch--> [Secure]
[Used] --code removal--> [Unused]
```

**Validation Rules**:

1. Version strings MUST follow semver format (major.minor.patch-prerelease+buildmetadata)
2. Transitive dependencies cannot be directly modified (updated via parent package)
3. A package cannot be both "current" and "outdated" simultaneously
4. Vulnerability severity cannot be null if isVulnerable is true

---

### Vulnerability

Represents a security flaw in a dependency.

**Fields**:

| Field          | Type       | Description                                                 | Validation                   |
| -------------- | ---------- | ----------------------------------------------------------- | ---------------------------- |
| id             | string     | CVE or GHSA identifier (e.g., "GHSA-8hc4-vh64-cxmj")        | Required, valid format       |
| package        | Dependency | The affected package                                        | Required                     |
| severity       | enum       | "critical" \| "high" \| "moderate" \| "low"                 | Required                     |
| title          | string     | Brief description of vulnerability                          | Required, non-empty          |
| affectedRange  | string     | Semver range of affected versions (e.g., ">=1.3.2 <=1.7.3") | Required, valid semver range |
| patchedVersion | string     | Version that fixes the vulnerability                        | Required, valid semver       |
| url            | string     | Link to vulnerability advisory                              | Required, valid URL          |
| isResolved     | boolean    | Whether vulnerability has been patched                      | Required                     |
| description    | string     | Detailed description of impact and exploitation             | Required, non-empty          |

**Relationships**:

- A Vulnerability affects one Dependency
- A Dependency can have multiple Vulnerability instances

**Validation Rules**:

1. Vulnerability ID MUST be unique
2. Patched version MUST be within or newer than affected range
3. URL MUST be accessible (valid HTTPS URL)
4. Critical/high severity vulnerabilities MUST be resolved before major version updates (per constitution)

**Business Rules**:

- All critical vulnerabilities MUST be resolved (Constitution: Security & Rate Limiting)
- All high vulnerabilities MUST be resolved (FR-001 to FR-004)
- Moderate/low vulnerabilities SHOULD be resolved when convenient

---

### Breaking Change

Represents a change in a new version that makes code written for previous versions incompatible.

**Fields**:

| Field             | Type           | Description                                                | Validation                     |
| ----------------- | -------------- | ---------------------------------------------------------- | ------------------------------ |
| package           | Dependency     | The package with breaking change                           | Required                       |
| fromVersion       | string         | Version before breaking change                             | Required, valid semver         |
| toVersion         | string         | Version after breaking change (introduces breaking change) | Required, valid semver         |
| type              | enum           | "major" \| "minor" \| "patch"                              | Required                       |
| description       | string         | Description of what changed                                | Required, non-empty            |
| affectedCode      | string[]       | List of files/functions affected                           | Required, non-empty array      |
| migrationRequired | boolean        | Whether code changes are required                          | Required                       |
| migrationGuide    | string \| null | Link to migration guide                                    | Optional, valid URL if present |
| isResolved        | boolean        | Whether code has been updated to handle change             | Required                       |

**Relationships**:

- A Breaking Change belongs to one Dependency
- A Dependency can have multiple Breaking Changes (one per version transition)

**Validation Rules**:

1. fromVersion and toVersion MUST differ
2. Affected code paths MUST exist in repository
3. If migrationRequired is true, migrationGuide MUST be provided

**Business Rules**:

- Major version upgrades MUST be documented (FR-013)
- Code MUST be updated before considering change resolved
- Breaking changes MUST be tested thoroughly (Constitution: Testing Discipline)

---

### Peer Dependency

Represents a dependency that must be installed by the consumer of the package.

**Fields**:

| Field            | Type           | Description                                        | Validation                     |
| ---------------- | -------------- | -------------------------------------------------- | ------------------------------ |
| requiringPackage | Dependency     | Package that requires this peer dependency         | Required                       |
| peerPackage      | string         | Name of peer dependency package                    | Required, valid package name   |
| requiredRange    | string         | Semver range required (e.g., "^2.0.0")             | Required, valid semver range   |
| installedVersion | string         | Currently installed version                        | Required, valid semver         |
| isSatisfied      | boolean        | Whether installed version satisfies required range | Required                       |
| conflictMessage  | string \| null | Error message if not satisfied                     | Optional, non-empty if present |

**Relationships**:

- A Peer Dependency is associated with one requiring Package
- A Package can have multiple Peer Dependencies

**Validation Rules**:

1. Installed version MUST be checked against required range
2. isSatisfied MUST accurately reflect version range compatibility
3. conflictMessage MUST be provided if isSatisfied is false

**Business Rules**:

- Peer dependency conflicts MUST be resolved before production deployment
- If isSatisfied is false, package may not work correctly
- May require additional package updates to resolve conflicts

---

### Lockfile

Represents the lockfile (pnpm-lock.yaml) that records exact versions of all installed dependencies.

**Fields**:

| Field         | Type         | Description                                       | Validation                 |
| ------------- | ------------ | ------------------------------------------------- | -------------------------- |
| format        | enum         | "pnpm" \| "npm" \| "yarn"                         | Required                   |
| formatVersion | number       | Lockfile format version                           | Required, positive integer |
| dependencies  | Dependency[] | All locked dependencies                           | Required                   |
| checksum      | string       | File hash for integrity verification              | Required, non-empty        |
| isConsistent  | boolean      | Whether lockfile matches package.json             | Required                   |
| needsUpdate   | boolean      | Whether lockfile is out of sync with package.json | Required                   |

**Relationships**:

- A Lockfile contains many Dependency instances
- Dependencies reference their parent Lockfile

**Validation Rules**:

1. Checksum MUST be computed from file contents
2. isConsistent MUST reflect whether dependencies match package.json ranges
3. needsUpdate MUST be true if dependencies have been added/removed but lockfile not updated

**Business Rules**:

- Lockfile MUST be updated after all dependency changes (FR-012)
- Lockfile MUST be committed to version control
- Lockfile MUST be consistent across all environments (dev, CI, production)

---

## Entity Relationships Diagram

```
Lockfile (1)
   |
   | contains
   |
   +-- Dependency (many)
        |
        | affected by
        |
        +-- Vulnerability (0..many)
        |
        | has
        |
        +-- Breaking Change (0..many)
        |
        | requires
        |
        +-- Peer Dependency (0..many)
        |
        | depends on
        |
        +-- Dependency (transitive, recursive)
```

## Cross-Entity Business Rules

1. **Security Priority**: All dependencies with critical/high vulnerabilities MUST be updated before any other dependency updates (Constitution: Security & Rate Limiting)

2. **Transitive Updates**: Transitive dependencies cannot be directly upgraded. Updating the parent package will update transitive dependencies automatically.

3. **Version Ordering**: When multiple dependencies need updates, order by:
    1. Security vulnerability severity (critical → high → moderate → low)
    2. Dependency type (production → development)
    3. Version range (patch → minor → major)

4. **Test Coverage**: After any dependency update:
    - All existing tests MUST pass (FR-009)
    - TypeScript MUST compile with zero errors (FR-014)
    - All 13 bot commands MUST function correctly (FR-010)

5. **Rollback Readiness**: Each dependency update MUST be committed atomically to enable easy rollback if issues occur.

6. **Documentation**: All major version updates MUST have corresponding Breaking Change entities with migration guides (FR-013).

## Migration Paths

### Dependency Version Upgrade

```
[Old Version] --install new version--> [New Version]
   |
   | triggers
   |
   +--> Check for Breaking Changes
   |       |
   |       | if present
   |       +--> Update Code
   |       |       |
   |       |       +--> Update Tests
   |       |       |
   |       |       +--> Run Test Suite
   |       |
   |       | if absent
   |       +--> Run Test Suite
   |
   +--> Test Bot Functionality
   |       |
   |       +--> If tests pass: Commit
   |       |
   |       +--> If tests fail: Rollback
```

### Vulnerability Resolution

```
[Vulnerable Dependency] --read advisory--> [Patched Version]
   |
   | install patched version
   |
   +--> [Patched Dependency]
   |       |
   |       run pnpm audit
   |       |
   |       +--> If clean: Commit
   |       |
   |       +--> If still vulnerable: Investigate transitive dependencies
```

## State Machine: Dependency Lifecycle

```
    ┌─────────────┐
    │  Installed  │
    └──────┬──────┘
           │
           ├──update─────────> ┌─────────────┐
           │                 │  Outdated    │
           │                 └──────┬──────┘
           │                        │
           ├──update──────────────────┘
           │
           ├──security advisory─────> ┌─────────────┐
           │                        │  Vulnerable  │
           │                        └──────┬──────┘
           │                               │
           │                               ├──patch──> ┌─────────────┐
           │                               │           │   Secure    │
           │                               │           └──────┬──────┘
           │                               │                  │
           │                               └──────────────────┘
           │
           └──code removal─────────────────> ┌─────────────┐
                                      │   Unused    │
                                      └─────────────┘
```

## Validation Summary

| Entity          | Key Validation Rules                              | Business Rules                   |
| --------------- | ------------------------------------------------- | -------------------------------- |
| Dependency      | Semver format, type, vulnerability/outdated flags | Security priority, test coverage |
| Vulnerability   | Unique ID, valid version range, accessible URL    | Critical/high MUST be resolved   |
| Breaking Change | Valid versions, affected code exists              | MUST be documented and tested    |
| Peer Dependency | Semver range satisfaction                         | Conflicts MUST be resolved       |
| Lockfile        | Consistency with package.json, checksum           | MUST be updated after changes    |

## Data Access Patterns

### Reading Dependency Information

```typescript
// Get all vulnerable dependencies
const vulnerableDeps = dependencies.filter((dep) => dep.isVulnerable);

// Get all outdated dependencies
const outdatedDeps = dependencies.filter((dep) => dep.isOutdated);

// Get unused dependencies
const unusedDeps = dependencies.filter((dep) => dep.isUnused);

// Get security updates (critical/high)
const securityUpdates = dependencies.filter(
    (dep) =>
        dep.isVulnerable &&
        ['critical', 'high'].includes(dep.vulnerabilitySeverity),
);
```

### Updating Dependencies

```typescript
// Update a dependency
function updateDependency(dep: Dependency, newVersion: string): void {
    const oldVersion = dep.version;
    dep.version = newVersion;

    // Check for breaking changes
    const breakingChanges = findBreakingChanges(oldVersion, newVersion);

    if (breakingChanges.length > 0) {
        // Migrate code
        migrateCode(breakingChanges);
    }

    // Update lockfile
    updateLockfile();

    // Test
    runTests();
    testBotCommands();
}
```

### Resolving Vulnerabilities

```typescript
// Resolve a vulnerability
function resolveVulnerability(vuln: Vulnerability): void {
    const dep = vuln.package;
    const oldVersion = dep.version;
    dep.version = vuln.patchedVersion;
    dep.isVulnerable = false;
    dep.vulnerabilitySeverity = null;
    vuln.isResolved = true;

    // Update lockfile
    updateLockfile();

    // Verify with audit
    runAudit();
}
```

## Notes

- These entities are conceptual models for tracking dependency management, not persistent database entities
- The actual implementation will use pnpm commands and filesystem operations
- Type definitions will be in TypeScript as per constitution Principle II
- All changes must support constitution principles, especially Type Safety, Testing Discipline, and Security
