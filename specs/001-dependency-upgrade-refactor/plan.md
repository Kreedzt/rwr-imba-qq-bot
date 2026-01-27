# Implementation Plan: Dependency Upgrade and Code Cleanup Refactor

**Branch**: `001-dependency-upgrade-refactor` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dependency-upgrade-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for execution workflow.

## Summary

Update all vulnerable and outdated dependencies to latest stable versions, remove unused packages, and ensure code quality through testing and linting. Primary goal is to eliminate 5 critical/high security vulnerabilities (vitest RCE, axios SSRF, fastify content-type bypass, tar-fs symlink bypass, form-data unsafe random) while maintaining backward compatibility and passing all 17 existing tests.

## Technical Context

**Language/Version**: TypeScript 5.7.2 with Node.js 22.11.0 (target: esnext)

**Primary Dependencies**:

- Fastify 5.1.0 (web framework)
- axios 1.6.2 (HTTP client)
- canvas 3.1.0 (image generation)
- vitest 2.1.8 (testing framework)
- @clickhouse/client 1.0.1 (analytics)
- tracer 1.1.6 (logging)
- jsonwebtoken 9.0.2 (authentication)
- dayjs 1.11.7 (date handling)
- pnpm (package manager)

**Storage**: ClickHouse (analytics), but not directly modified in this feature

**Testing**: Vitest with coverage-istanbul

**Target Platform**: Linux server (Docker container)

**Project Type**: Single project (monorepo structure)

**Performance Goals**: Command execution within 5 seconds (non-image) and 30 seconds (image generation) per constitution

**Constraints**: TypeScript strict mode enabled, zero critical/high security vulnerabilities allowed, maintain 17% baseline test coverage

**Scale/Scope**: 98 TypeScript files, 17 test files, 13 bot commands (roll, tdoll, website, servers, setu, neko, touhou, waifu, ai, fuck, 1pt, qa, log, version)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Research Gates

- ✅ **Principle I (Modular Command System)**: No changes to command architecture - maintains independence and testability
- ✅ **Principle II (Type Safety & Strict Mode)**: FR-014 requires TypeScript compilation success - this UPGRADES compliance by updating type definitions
- ✅ **Principle III (Environment-First Configuration)**: No hardcoded configuration changes planned
- ✅ **Principle IV (Observability & Logging)**: Updates to tracer and vitest maintain logging capabilities
- ✅ **Principle V (Graceful Degradation & Error Handling)**: No changes to error handling patterns
- ✅ **Principle VI (Image Generation via Canvas)**: canvas package update maintains existing patterns
- ✅ **Principle VII (Testing Discipline)**: FR-009 requires all tests pass - vitest update improves testing infrastructure
- ✅ **Security & Rate Limiting**: No changes to authorization or rate limiting mechanisms
- ✅ **Performance Standards**: FR-010 ensures bot commands continue to meet performance requirements
- ✅ **Data Privacy**: No changes to data logging or privacy practices

### Post-Design Re-check (after Phase 1 design)

✅ **All gates confirmed passing** - This is a maintenance activity that strengthens compliance rather than violating it.

**Design Review Completed**:

- ✅ **Data Model**: Defines clear entities for Dependency, Vulnerability, Breaking Change, Peer Dependency, Lockfile
- ✅ **Migration Guide**: Comprehensive documentation for all version changes with testing procedures
- ✅ **Quick Start**: Step-by-step execution guide with rollback procedures
- ✅ **Agent Context**: Updated with TypeScript 5.7.2 and Node.js 22.11.0 specifications

**Constitution Compliance Strengthened**:

- **Principle II (Type Safety)**: Type definitions updated via dev dependency upgrades
- **Principle VII (Testing Discipline)**: vitest upgrade improves testing infrastructure
- **Security & Rate Limiting**: All critical/high vulnerabilities will be resolved
- **Performance Standards**: No degradation expected, improvements from dependency updates

**No Violations Identified**: All principles are upheld or strengthened by this maintenance feature.

## Project Structure

### Documentation (this feature)

```text
specs/001-dependency-upgrade-refactor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── migration-guide.md  # API/dependency change documentation
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── commands/            # Command implementations (13 commands)
├── services/            # Shared services (RemoteService, ClickHouseService, etc.)
├── utils/               # Utility functions (logger, env, time, etc.)
├── types.ts             # Global type definitions
├── index.ts             # Fastify server entry point
├── routes.ts            # Route definitions
└── eventHandler.ts      # OneBot event handling

tests/
├── commands/            # Command-specific tests
├── services/            # Service tests
└── utils/               # Utility tests
```

**Structure Decision**: This is a single project using the existing monorepo structure. No new directories or modules will be created. All work involves updating package.json, pnpm-lock.yaml, and verifying existing code continues to function correctly.

## Complexity Tracking

> No violations detected - this is a maintenance activity that strengthens compliance with existing principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
