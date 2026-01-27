# Research: Dependency Upgrade and Code Cleanup Refactor

**Feature**: 001-dependency-upgrade-refactor
**Phase**: 0 - Outline & Research
**Date**: 2025-01-27

## Overview

This document consolidates research findings for dependency upgrades and code cleanup. Research covers security vulnerabilities, outdated package updates, best practices, and tools for identifying unused dependencies.

## Security Vulnerabilities Research

### 1. Vitest - Remote Code Execution (Critical)

**Vulnerability**: GHSA-9crc-q9x8-hgqq
**Affected Range**: >=2.0.0 <2.1.9
**Patched Version**: 2.1.9 or higher
**Current**: 2.1.8

**Impact**: Allows Remote Code Execution when accessing a malicious website while Vitest API server is listening. This is critical for development environments but could affect CI/CD pipelines.

**Decision**: Upgrade vitest to 2.1.9 or higher

**Rationale**:

- Critical security vulnerability
- Patch version (2.1.9) is backwards compatible
- No breaking changes expected
- FR-001 mandates this upgrade

**Alternatives Considered**:

- Replace with Jest: Would require significant test rewrite, not justified for patch version
- Pin current version: Unacceptable due to critical vulnerability
- Wait for major version update: Would leave vulnerability exposed

**Mitigation**: After upgrade, ensure all CI/CD pipelines use updated vitest version and API server is not exposed to public networks.

---

### 2. Axios - Server-Side Request Forgery (High)

**Vulnerability**: GHSA-8hc4-vh64-cxmj
**Affected Range**: >=1.3.2 <=1.7.3
**Patched Version**: 1.7.4 or higher
**Current**: 1.6.2

**Impact**: Server-Side Request Forgery vulnerability that could allow attackers to make requests on behalf of the server to internal resources. This is critical for the RemoteService that communicates with go-cqhttp.

**Decision**: Upgrade axios to 1.7.4 or higher

**Rationale**:

- High severity vulnerability affecting core bot functionality
- Patch version (1.7.4) is backwards compatible
- FR-002 mandates this upgrade
- Critical for RemoteService security

**Alternatives Considered**:

- Replace with fetch: Would require extensive rewrite of RemoteService
- Add request validation middleware: Doesn't fix the vulnerability in axios itself
- Pin current version: Unacceptable security risk

**Mitigation**: Test all RemoteService calls after upgrade to ensure no breaking changes in request/response handling.

---

### 3. Fastify - Content-Type Parsing Bypass (High)

**Vulnerability**: GHSA-mg2h-6x62-wpwc
**Affected Range**: >=5.0.0 <=5.3.1
**Patched Version**: 5.3.2 or higher
**Current**: 5.1.0

**Impact**: Invalid content-type parsing could lead to validation bypass, allowing malicious payloads to bypass request validation.

**Decision**: Upgrade fastify to 5.3.2 or higher

**Rationale**:

- High severity vulnerability affecting request validation
- Patch version (5.3.2) is backwards compatible
- FR-003 mandates this upgrade
- Critical for all bot command validation

**Alternatives Considered**:

- Add additional validation middleware: Doesn't fix the core vulnerability
- Downgrade to pre-5.0.0: Would introduce other issues and lose features
- Replace with Express: Would require complete rewrite, not justified

**Mitigation**: Test all command validation logic after upgrade to ensure no regression in request parsing.

---

### 4. tar-fs - Symlink Validation Bypass (High)

**Vulnerability**: GHSA-vj76-c3g6-qr5v and related
**Affected Range**: >=2.0.0 <2.1.4
**Patched Version**: 2.1.4 or higher
**Current**: Indirect dependency via canvas > prebuild-install

**Impact**: Allows symlink validation bypass if destination directory is predictable with a specific tarball. Could lead to file system overwrite attacks during package installation.

**Decision**: This will be automatically fixed when canvas package is updated

**Rationale**:

- Indirect dependency (transitive)
- Will be resolved by updating canvas to latest version
- canvas update is already planned for outdated package upgrades
- FR-004 covers all critical/high vulnerabilities

**Alternatives Considered**:

- Manually override tar-fs version: Not recommended, could break canvas
- Use different canvas package: Would require significant code changes
- Accept risk: Unacceptable for high severity vulnerability

**Mitigation**: Ensure canvas update includes updated tar-fs version and test image generation thoroughly.

---

### 5. form-data - Unsafe Random Function (Critical)

**Vulnerability**: GHSA-fjxv-7rqg-78g4
**Affected Range**: >=4.0.0 <4.0.4
**Patched Version**: 4.0.4 or higher
**Current**: Indirect dependency via axios

**Impact**: Uses unsafe random function for choosing boundary, potentially making multipart form data predictable. Could affect security of file uploads.

**Decision**: This will be automatically fixed when axios package is updated

**Rationale**:

- Indirect dependency (transitive)
- Will be resolved by updating axios to 1.7.4+
- axios update is already planned (FR-002)
- FR-004 covers all critical/high vulnerabilities

**Alternatives Considered**:

- Manually override form-data version: Not recommended, could break axios
- Replace axios multipart implementation: Not practical
- Accept risk: Unacceptable for critical vulnerability

**Mitigation**: Verify axios update includes patched form-data version.

---

## Outdated Package Updates Research

### Major Version Updates Analysis

Based on `pnpm outdated` output, the following major version updates are required:

1. **cron**: 3.x → 4.x (Wanted: 3.5.0, Latest: 4.4.0)
    - **Breaking Changes**: Check migration guide for v4
    - **Risk**: Medium - may affect scheduled tasks
    - **Action**: Update and test all cron-based functionality

2. **dotenv**: 16.x → 17.x (Wanted: 16.6.1, Latest: 17.2.3)
    - **Breaking Changes**: Check migration guide for v17
    - **Risk**: Low - typically minor changes in dotenv
    - **Action**: Update and verify environment variable loading

3. **fast-xml-parser**: 4.x → 5.x (Wanted: 4.5.3, Latest: 5.3.3)
    - **Breaking Changes**: Check migration guide for v5
    - **Risk**: Medium - may affect XML parsing
    - **Action**: Update and test all XML parsing operations

4. **@fastify/static**: 8.x → 9.x (Wanted: 8.3.0, Latest: 9.0.0)
    - **Breaking Changes**: Check migration guide for v9
    - **Risk**: Low - static file serving
    - **Action**: Update and verify static file serving

5. **@clickhouse/client**: 1.0.1 → 1.16.0 (Wanted: 1.8.1, Latest: 1.16.0)
    - **Breaking Changes**: Patch/major versions
    - **Risk**: Medium - analytics functionality
    - **Action**: Update and test ClickHouse queries

6. **echarts**: 5.x → 6.x (Wanted: 5.6.0, Latest: 6.0.0)
    - **Breaking Changes**: Major version update
    - **Risk**: Medium - chart generation
    - **Action**: Update and test all chart generation

7. **canvas**: 3.1.0 → 3.2.1 (Wanted: 3.1.0, Latest: 3.2.1)
    - **Breaking Changes**: Patch version update
    - **Risk**: Low - image generation
    - **Action**: Update and test all image generation commands

### Minor/Patch Version Updates

The following are minor or patch updates (lower risk):

- dayjs: 1.11.7 → 1.11.19
- jsonwebtoken: 9.0.2 → 9.0.3
- lodash: 4.17.21 → 4.17.23
- pinyin-match: 1.2.4 → 1.2.10
- tracer: 1.1.6 → 1.3.0
- Development dependencies: @types packages, rollup, vite, vitest

**Decision**: Update all packages in phases:

1. **Phase A** (Security): vitest, axios, fastify - CRITICAL, do first
2. **Phase B** (Major Updates): cron, dotenv, fast-xml-parser, @fastify/static, @clickhouse/client, echarts - Test thoroughly
3. **Phase C** (Minor/Patch): dayjs, jsonwebtoken, lodash, pinyin-match, tracer, dev dependencies - Lower risk, batch update

**Rationale**:

- Incremental approach reduces risk
- Security patches must come first
- Major versions need individual testing
- Patch versions can be batched

**Alternatives Considered**:

- Update all at once: High risk, harder to identify issues
- Skip major versions: Accumulates technical debt
- Update only security patches: Leaves outdated packages
- **Selected**: Phased approach balances risk and benefits

---

## Best Practices for Dependency Updates

### Update Order Strategy

**Research Finding**: Industry best practices for dependency updates:

1. **Security patches first** - Critical and high vulnerabilities must be addressed immediately
2. **Transitive dependencies** - Updated by updating direct dependencies
3. **Lockfile discipline** - Always update pnpm-lock.yaml after package changes
4. **Incremental testing** - Test after each batch of updates
5. **Rollback readiness** - Keep git commits atomic for easy rollback

**Decision**: Follow phased update strategy (A → B → C) as outlined above

**Rationale**:

- Reduces risk of introducing multiple issues simultaneously
- Makes rollback easier
- Allows testing to focus on specific changes
- Industry-standard practice for production systems

---

### Testing Strategy

**Research Finding**: Testing approaches for dependency updates:

1. **Test suite execution** - Run all existing tests after each update phase
2. **Smoke testing** - Verify bot can start and handle basic commands
3. **Integration testing** - Test each of the 13 commands independently
4. **Type checking** - Run TypeScript compiler to catch type errors
5. **Linting** - Run prettier to ensure code quality
6. **Manual verification** - Test critical user flows

**Decision**: Implement comprehensive testing after each phase:

- Run `pnpm test` (all 17 tests)
- Run `pnpm build` (TypeScript compilation)
- Run `pnpm run lint` (code formatting)
- Test bot startup and basic command execution
- Test image generation commands (servers, tdoll)
- Test data queries (website, servers analytics)

**Rationale**:

- Ensures no regressions
- Catches issues early
- Aligns with FR-009, FR-010, FR-014, FR-015
- Follows constitution Principle VII (Testing Discipline)

---

### Breaking Change Handling

**Research Finding**: Handling breaking changes from major version updates:

1. **Read migration guides** - Check package changelogs and migration docs
2. **Identify breaking changes** - List API changes, removed features, new requirements
3. **Update code** - Modify affected code to use new APIs
4. **Test thoroughly** - Focus on updated functionality
5. **Document changes** - Record breaking changes in migration guide

**Decision**: For each major version update:

1. Read package changelog and migration guide
2. Identify all breaking changes
3. Update code to use new APIs
4. Add tests for updated functionality if needed
5. Document in migration-guide.md

**Rationale**:

- Minimizes risk of breaking changes
- Ensures compatibility
- Provides clear documentation
- Aligns with FR-013 (document breaking changes)

---

## Unused Dependency Detection

### Tools and Techniques

**Research Finding**: Tools for identifying unused dependencies:

1. **depcheck** - npm package that detects unused dependencies
2. **pnpm why** - Shows which packages depend on a specific package
3. **Manual analysis** - Search for imports across codebase
4. **Build analysis** - Check what's actually bundled

**Decision**: Use combination of tools:

1. Run `pnpm add -D depcheck` to install analysis tool
2. Run `depcheck` to identify unused dependencies
3. Manually verify imports for packages flagged as unused
4. Check pnpm-lock.yaml for transitive dependencies

**Rationale**:

- Automated detection is faster and more reliable
- Manual verification reduces false positives
- Supports FR-007 and FR-008
- Helps achieve SC-007 (5% reduction)

---

### Dead Code Identification

**Research Finding**: Identifying dead code:

1. **Coverage reports** - Low or zero coverage may indicate dead code
2. **Search for unused exports** - Exported functions not imported anywhere
3. **Linter warnings** - Some linters flag unused variables/exports
4. **Manual review** - Look for commented code or TODOs

**Decision**:

1. Review coverage report to identify uncovered code
2. Search for exports with zero imports
3. Run linter to catch unused variables
4. Manually review suspicious code blocks

**Rationale**:

- Reduces maintenance burden
- Improves code clarity
- Supports US3 (Code Quality Improvements)

---

### Bundle Size Measurement

**Research Finding**: Tools for measuring bundle size:

1. **build output analysis** - Check dist/ directory size
2. **bundlesize** - npm package for monitoring bundle size
3. **webpack-bundle-analyzer** - Visualize bundle composition
4. **Simple du command** - Directory size measurement

**Decision**:

1. Measure bundle size before updates (baseline)
2. Compare after updates
3. Ensure <10% increase per SC-010
4. Document bundle size in migration guide

**Rationale**:

- Supports SC-010 (bundle size constraint)
- Helps identify unexpected bloat
- Monitors impact of dependency updates

---

## Migration Documentation Strategy

**Research Finding**: Best practices for documenting dependency updates:

1. **Before and after versions** - Document all version changes
2. **Breaking changes** - List API changes and migration steps
3. **Testing notes** - Record what was tested and results
4. **Rollback procedure** - How to revert if issues occur
5. **Known issues** - Document any problems or limitations

**Decision**: Create `contracts/migration-guide.md` with:

1. Table of all package version changes (before → after)
2. Section for each major version update with breaking changes
3. Testing checklist for each phase
4. Rollback instructions
5. Known issues and workarounds

**Rationale**:

- Supports FR-011 (comprehensive migration document)
- Aligns with SC-009 (migration document produced)
- Helps with future updates
- Provides audit trail

---

## Summary of Decisions

### Security Updates (Phase A - CRITICAL)

1. vitest: 2.1.8 → 2.1.9+ (patch version)
2. axios: 1.6.2 → 1.7.4+ (patch version)
3. fastify: 5.1.0 → 5.3.2+ (patch version)
4. tar-fs: (via canvas) - updated indirectly
5. form-data: (via axios) - updated indirectly

### Major Updates (Phase B - MEDIUM RISK)

1. cron: 3.x → 4.x
2. dotenv: 16.x → 17.x
3. fast-xml-parser: 4.x → 5.x
4. @fastify/static: 8.x → 9.x
5. @clickhouse/client: 1.x → 1.16.0
6. echarts: 5.x → 6.x
7. canvas: 3.1.0 → 3.2.1

### Minor/Patch Updates (Phase C - LOW RISK)

1. dayjs, jsonwebtoken, lodash, pinyin-match, tracer
2. All development dependencies

### Tools and Processes

1. Use depcheck for unused dependency detection
2. Phased update approach (A → B → C)
3. Comprehensive testing after each phase
4. Migration guide documentation
5. Bundle size monitoring

## Risks and Mitigations

| Risk                                   | Mitigation                                               |
| -------------------------------------- | -------------------------------------------------------- |
| Breaking changes in major updates      | Read migration guides, test thoroughly, document changes |
| Type errors revealed by updates        | TypeScript compilation (FR-014), fix immediately         |
| Test failures after updates            | Incremental testing, easy rollback with atomic commits   |
| Unused dependency false positives      | Manual verification before removal                       |
| Bundle size increase >10%              | Monitor after updates, identify and remove unused code   |
| Security patches introduce regressions | Test security patches first, critical priority           |

## Next Steps

Proceed to Phase 1 (Design & Contracts) to create:

1. data-model.md - Entities for dependency management
2. contracts/migration-guide.md - API/dependency change documentation
3. quickstart.md - Quick start guide for executing updates
4. Update agent context with new technologies
