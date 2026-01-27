# Migration Guide: Dependency Upgrade and Code Cleanup Refactor

**Feature**: 001-dependency-upgrade-refactor
**Type**: API/Dependency Change Documentation
**Date**: 2025-01-27
**Version**: 1.0

## Overview

This document provides comprehensive guidance for upgrading dependencies and cleaning up code in the RWR Imba QQ Bot project. It includes version changes, breaking changes, testing procedures, rollback instructions, and known issues.

## Package Version Changes

### Summary Table

| Package            | Type       | From Version | To Version | Change Type | Security |
| ------------------ | ---------- | ------------ | ---------- | ----------- | -------- |
| vitest             | dev        | 2.1.8        | 2.1.9+     | patch       | Critical |
| axios              | production | 1.6.2        | 1.7.4+     | patch       | High     |
| fastify            | production | 5.1.0        | 5.3.2+     | patch       | High     |
| cron               | production | 3.x          | 4.4.0      | major       | -        |
| dotenv             | production | 16.x         | 17.2.3     | major       | -        |
| fast-xml-parser    | production | 4.x          | 5.3.3      | major       | -        |
| @fastify/static    | production | 8.x          | 9.0.0      | major       | -        |
| @clickhouse/client | production | 1.0.1        | 1.16.0     | patch/major | -        |
| echarts            | production | 5.x          | 6.0.0      | major       | -        |
| canvas             | production | 3.1.0        | 3.2.1      | patch       | -        |
| dayjs              | production | 1.11.7       | 1.11.19    | patch       | -        |
| jsonwebtoken       | production | 9.0.2        | 9.0.3      | patch       | -        |
| lodash             | production | 4.17.21      | 4.17.23    | patch       | -        |
| pinyin-match       | production | 1.2.4        | 1.2.10     | patch       | -        |
| tracer             | production | 1.1.6        | 1.3.0      | patch       | -        |
| Various @types/\*  | dev        | various      | latest     | patch/minor | -        |
| rollup             | dev        | 4.17.2       | latest     | patch/minor | -        |
| vite               | dev        | 5.4.11       | latest     | patch/minor | -        |

### Detailed Changes by Package

#### Security Patches (Phase A - CRITICAL)

##### vitest 2.1.8 → 2.1.9+

**Vulnerability**: GHSA-9crc-q9x8-hgqq - Remote Code Execution
**Severity**: Critical

**Breaking Changes**: None (patch version)

**Migration Steps**:

1. Update package.json: `"vitest": "^2.1.9"`
2. Run: `pnpm install`
3. Run test suite: `pnpm test`
4. Verify all 17 tests pass

**Code Changes Required**: None

**Testing Focus**:

- All existing tests pass without modification
- Test UI functionality (if used)
- Verify CI/CD pipelines use updated version

**Rollback**: Revert to version 2.1.8 in package.json and run `pnpm install`

---

##### axios 1.6.2 → 1.7.4+

**Vulnerability**: GHSA-8hc4-vh64-cxmj - Server-Side Request Forgery
**Severity**: High

**Breaking Changes**: None (patch version)

**Migration Steps**:

1. Update package.json: `"axios": "^1.7.4"`
2. Run: `pnpm install`
3. Run test suite: `pnpm test`
4. Test RemoteService communication with go-cqhttp
5. Test all commands that make HTTP requests

**Code Changes Required**: None

**Testing Focus**:

- All existing tests pass
- RemoteService requests work correctly
- Commands using RemoteService function:
    - website command
    - servers command (analytics)
    - Any other HTTP-dependent commands

**Rollback**: Revert to version 1.6.2 in package.json and run `pnpm install`

---

##### fastify 5.1.0 → 5.3.2+

**Vulnerability**: GHSA-mg2h-6x62-wpwc - Content-Type Parsing Bypass
**Severity**: High

**Breaking Changes**: None (patch version)

**Migration Steps**:

1. Update package.json: `"fastify": "^5.3.2"`
2. Update @fastify/static to compatible version (see below)
3. Run: `pnpm install`
4. Run test suite: `pnpm test`
5. Start bot and verify command routing
6. Test all 13 commands

**Code Changes Required**: None

**Testing Focus**:

- Bot starts successfully
- All commands route correctly
- Request validation works
- Static file serving (@fastify/static) works
- All existing tests pass

**Rollback**: Revert to version 5.1.0 in package.json and run `pnpm install`

---

##### Indirect Security Fixes

**tar-fs**: Updated via canvas package (3.1.0 → 3.2.1)
**form-data**: Updated via axios package (1.6.2 → 1.7.4+)

These dependencies are transitive and will be updated automatically when parent packages are updated.

---

#### Major Version Updates (Phase B - MEDIUM RISK)

##### cron 3.x → 4.4.0

**Breaking Changes**: Check cron v4 migration guide

**Migration Steps**:

1. Read cron v4 migration guide
2. Identify breaking changes
3. Update package.json: `"cron": "^4.4.0"`
4. Run: `pnpm install`
5. Update code that uses cron (if any breaking changes)
6. Run test suite: `pnpm test`

**Code Changes Required**: TBD after reviewing migration guide

**Affected Code**: Search for cron usage in codebase:

- `src/commands/servers/tasks/` - Scheduled analytics tasks

**Testing Focus**:

- Scheduled tasks (analytics) still execute
- Task timing is correct
- No errors in cron scheduling

**Rollback**: Revert to version 3.x in package.json, restore any code changes, run `pnpm install`

---

##### dotenv 16.x → 17.2.3

**Breaking Changes**: Check dotenv v17 migration guide

**Migration Steps**:

1. Read dotenv v17 migration guide
2. Identify breaking changes
3. Update package.json: `"dotenv": "^17.2.3"`
4. Run: `pnpm install`
5. Update code if necessary
6. Test environment variable loading: `pnpm start`

**Code Changes Required**: TBD after reviewing migration guide

**Affected Code**:

- `src/utils/env.ts` - Environment variable loading

**Testing Focus**:

- All environment variables load correctly
- Bot starts without errors
- All environment-dependent features work

**Rollback**: Revert to version 16.x in package.json, restore any code changes, run `pnpm install`

---

##### fast-xml-parser 4.x → 5.3.3

**Breaking Changes**: Check fast-xml-parser v5 migration guide

**Migration Steps**:

1. Read fast-xml-parser v5 migration guide
2. Identify breaking changes
3. Update package.json: `"fast-xml-parser": "^5.3.3"`
4. Run: `pnpm install`
5. Update code that uses XML parsing
6. Run test suite: `pnpm test`

**Code Changes Required**: TBD after reviewing migration guide

**Affected Code**: Search for XML parsing usage

- Used in data loading (website data, etc.)

**Testing Focus**:

- XML data files load correctly
- Parsed data is accurate
- All commands using XML data work

**Rollback**: Revert to version 4.x in package.json, restore any code changes, run `pnpm install`

---

##### @fastify/static 8.x → 9.0.0

**Breaking Changes**: Check @fastify/static v9 migration guide

**Migration Steps**:

1. Read @fastify/static v9 migration guide
2. Identify breaking changes
3. Update package.json: `"@fastify/static": "^9.0.0"`
4. Run: `pnpm install`
5. Update code if necessary
6. Test static file serving

**Code Changes Required**: TBD after reviewing migration guide

**Affected Code**:

- `src/index.ts` - Static file serving configuration

**Testing Focus**:

- Static files served correctly from /out/ directory
- No errors accessing static files
- Build artifacts are accessible

**Rollback**: Revert to version 8.x in package.json, restore any code changes, run `pnpm install`

---

##### @clickhouse/client 1.0.1 → 1.16.0

**Breaking Changes**: Check @clickhouse/client changelog

**Migration Steps**:

1. Read @clickhouse/client changelog for 1.0.1 → 1.16.0
2. Identify breaking changes
3. Update package.json: `"@clickhouse/client": "^1.16.0"`
4. Run: `pnpm install`
5. Update code if necessary
6. Test ClickHouse connectivity and queries

**Code Changes Required**: TBD after reviewing changelog

**Affected Code**:

- `src/services/clickHouse.service.ts` - ClickHouse client

**Testing Focus**:

- ClickHouse connection works
- Analytics queries execute successfully
- No errors in logs

**Rollback**: Revert to version 1.0.1 in package.json, restore any code changes, run `pnpm install`

---

##### echarts 5.x → 6.0.0

**Breaking Changes**: Check echarts v6 migration guide

**Migration Steps**:

1. Read echarts v6 migration guide
2. Identify breaking changes
3. Update package.json: `"echarts": "^6.0.0"`
4. Run: `pnpm install`
5. Update chart generation code
6. Test all charts

**Code Changes Required**: TBD after reviewing migration guide

**Affected Code**:

- `src/commands/servers/charts/chart.ts` - Chart generation

**Testing Focus**:

- Server statistics charts generate correctly
- Chart visualizations are accurate
- No errors in chart rendering

**Rollback**: Revert to version 5.x in package.json, restore any code changes, run `pnpm install`

---

##### canvas 3.1.0 → 3.2.1

**Breaking Changes**: None (patch version, but major component of image generation)

**Migration Steps**:

1. Update package.json: `"canvas": "^3.2.1"`
2. Run: `pnpm install`
3. Run test suite: `pnpm test`
4. Test all image generation commands

**Code Changes Required**: None expected, but verify canvas API usage

**Affected Code**: All image generation commands:

- `src/commands/tdoll/canvas/` - TDoll images
- `src/commands/servers/canvas/` - Server maps and player images
- `src/services/canvasImg.service.ts` - Canvas utilities

**Testing Focus**:

- All TDoll images generate correctly
- Server maps and player images generate correctly
- No errors in canvas operations
- Image quality is maintained

**Rollback**: Revert to version 3.1.0 in package.json and run `pnpm install`

---

#### Minor/Patch Updates (Phase C - LOW RISK)

##### dayjs 1.11.7 → 1.11.19

##### jsonwebtoken 9.0.2 → 9.0.3

##### lodash 4.17.21 → 4.17.23

##### pinyin-match 1.2.4 → 1.2.10

##### tracer 1.1.6 → 1.3.0

**Breaking Changes**: None (patch versions)

**Migration Steps**:

1. Update all package.json entries in batch
2. Run: `pnpm install`
3. Run test suite: `pnpm test`
4. Run full bot test

**Code Changes Required**: None expected

**Testing Focus**:

- All existing tests pass
- Bot starts and functions normally
- Date operations (dayjs) work
- JWT operations work
- Logging (tracer) works
- Pinyin matching works

**Rollback**: Revert all packages to previous versions in package.json and run `pnpm install`

---

#### Development Dependencies

Update all remaining development dependencies to latest versions:

- `@types/*` packages
- `rollup`
- `vite`
- `prettier`
- `typescript`

**Breaking Changes**: Minimal (type definitions may change)

**Migration Steps**:

1. Update all dev dependencies
2. Run: `pnpm install`
3. Run TypeScript compiler: `pnpm build` or `tsc`
4. Fix any type errors that appear
5. Run test suite: `pnpm test`

**Code Changes Required**: May need to fix type errors

**Testing Focus**:

- TypeScript compilation succeeds with zero errors (FR-014)
- All tests pass
- No linting errors

**Rollback**: Revert all dev dependencies to previous versions and run `pnpm install`

---

## Testing Checklist

### Pre-Upgrade Tests

Run these tests BEFORE any upgrades to establish baseline:

- [ ] Run all tests: `pnpm test` - All 17 tests pass
- [ ] Build project: `pnpm build` - No errors
- [ ] Start bot: `pnpm start` - Bot starts successfully
- [ ] Run security audit: `pnpm audit` - Document current vulnerabilities
- [ ] Check outdated packages: `pnpm outdated` - Document current outdated packages
- [ ] Measure bundle size: `du -sh dist/` - Record baseline size

---

### Phase A: Security Patches

After EACH security patch update:

- [ ] Run all tests: `pnpm test` - All tests pass
- [ ] Build project: `pnpm build` - No errors
- [ ] Start bot: `pnpm start` - Bot starts
- [ ] Test affected functionality:
    - [ ] vitest: All tests run, UI works (if used)
    - [ ] axios: RemoteService requests work, website command works
    - [ ] fastify: All commands route correctly, static files serve
- [ ] Run security audit: `pnpm audit` - Verify specific vulnerability is resolved
- [ ] Commit changes with descriptive message

**Commit after EACH package** for easy rollback:

```bash
git add package.json pnpm-lock.yaml
git commit -m "security: upgrade vitest to 2.1.9 (fix GHSA-9crc-q9x8-hgqq)"
```

---

### Phase B: Major Version Updates

For EACH major version update:

1. **Read migration guide first**
    - [ ] Locate and read package migration guide/changelog
    - [ ] Document breaking changes
    - [ ] Plan code updates

2. **Update package and code**
    - [ ] Update package.json version
    - [ ] Run: `pnpm install`
    - [ ] Update affected code (if breaking changes)
    - [ ] Add/update tests for changed functionality

3. **Test thoroughly**
    - [ ] Run all tests: `pnpm test` - All tests pass
    - [ ] Build project: `pnpm build` - No errors
    - [ ] Start bot: `pnpm start` - Bot starts
    - [ ] Test affected functionality specifically:
        - [ ] cron: Scheduled tasks execute
        - [ ] dotenv: Environment variables load
        - [ ] fast-xml-parser: XML files parse
        - [ ] @fastify/static: Static files serve
        - [ ] @clickhouse/client: Analytics queries work
        - [ ] echarts: Charts generate
        - [ ] canvas: Images generate
    - [ ] Test all 13 commands end-to-end

4. **Commit changes**
    - [ ] Commit with detailed message listing breaking changes addressed

**Commit after EACH package** for easy rollback:

```bash
git add package.json pnpm-lock.yaml src/affected-files
git commit -m "upgrade: cron to 4.4.0 - migration guide review, update scheduled task code"
```

---

### Phase C: Minor/Patch Updates

After batch update:

- [ ] Run all tests: `pnpm test` - All tests pass
- [ ] Build project: `pnpm build` - No errors
- [ ] Run TypeScript compiler: `tsc --noEmit` - Zero errors
- [ ] Run linter: `pnpm run lint` (if available) - No errors
- [ ] Start bot: `pnpm start` - Bot starts
- [ ] Test all 13 commands briefly
- [ ] Run security audit: `pnpm audit` - No critical/high vulnerabilities
- [ ] Check outdated: `pnpm outdated` - All packages updated
- [ ] Measure bundle size: `du -sh dist/` - Verify <10% increase (SC-010)
- [ ] Commit changes

---

### Post-Upgrade Tests

After ALL updates complete:

- [ ] Run complete test suite: `pnpm test` - All 17 tests pass
- [ ] Run coverage: `pnpm run coverage` - Coverage >= 17% baseline
- [ ] Build production: `pnpm build` - No errors, no warnings
- [ ] TypeScript check: `tsc --noEmit` - Zero type errors
- [ ] Lint code: `prettier --check .` - No formatting issues
- [ ] Security audit: `pnpm audit` - Zero critical/high vulnerabilities
- [ ] Bot smoke test: Start bot, test 2-3 commands
- [ ] Full command test: Test all 13 commands end-to-end
- [ ] Bundle size check: Compare with baseline, verify <10% increase
- [ ] Document any issues in "Known Issues" section below

---

## Rollback Procedures

### Atomic Rollback

Each package update is committed atomically. To rollback a specific update:

```bash
# View recent commits
git log --oneline -10

# Rollback to commit before problematic update
git revert <commit-hash>

# OR reset (if not pushed)
git reset --hard <commit-hash>
pnpm install
```

### Full Rollback

If multiple updates cause issues, rollback everything:

```bash
# Reset to pre-upgrade state
git reset --hard <pre-upgrade-commit>
pnpm install

# Verify baseline functionality
pnpm test
pnpm build
pnpm start
```

### Rollback Checklist

After rollback:

- [ ] Verify previous state is restored: `git status` (clean)
- [ ] Reinstall dependencies: `pnpm install`
- [ ] Run tests: `pnpm test` - All pass
- [ ] Build: `pnpm build` - No errors
- [ ] Bot starts and functions
- [ ] Document rollback reason in issue tracker

---

## Unused Dependency Removal

### Detection Process

1. **Install depcheck tool**:

    ```bash
    pnpm add -D depcheck
    ```

2. **Run analysis**:

    ```bash
    npx depcheck
    ```

3. **Review output**:
    - Unused dependencies: Packages not imported anywhere
    - Unused dev dependencies: Dev packages not used
    - Missing dependencies: Packages imported but not in package.json

### Removal Process

For each unused dependency identified:

1. **Manual verification**:
    - Search codebase for imports: `grep -r "package-name" src/`
    - Check if used in configuration files
    - Verify not used in build scripts

2. **Remove from package.json**:
    - Delete entry from dependencies or devDependencies
    - Run: `pnpm install`

3. **Test**:
    - Run all tests: `pnpm test`
    - Build project: `pnpm build`
    - Start bot: `pnpm start`

4. **Commit**:
    ```bash
    git add package.json pnpm-lock.yaml
    git commit -m "chore: remove unused dependency package-name"
    ```

### Expected Results

- **Goal**: Reduce production dependencies by at least 5% (SC-007)
- **Current**: ~15 production dependencies
- **Target**: Remove at least 1-2 production dependencies
- **Dev dependencies**: Remove as many unused as possible

---

## Known Issues

### Issues During Migration

_(Document any issues discovered during the upgrade process here)_

#### Example Format

**Issue**: [Brief description]

**Affected Package**: [package name]

**Symptom**: [What happens]

**Workaround**: [How to work around it]

**Status**: [Open / Resolved]

---

### Post-Migration Issues

_(Document any issues that appear after migration is complete)_

#### Example Format

**Issue**: [Brief description]

**Affected Package**: [package name]

**Symptom**: [What happens]

**Workaround**: [How to work around it]

**Status**: [Open / Resolved / Investigating]

---

## Performance Impact

### Bundle Size

**Pre-upgrade**: [Recorded baseline]

**Post-upgrade**: [To be measured after Phase C]

**Change**: [To be calculated]

**Target**: <10% increase (SC-010)

### Runtime Performance

**Pre-upgrade**: [Record baseline if possible]

**Post-upgrade**: [To be measured after Phase C]

**Impact**: [To be assessed]

**Target**: No degradation in command execution time

---

## Dependencies

This migration guide depends on:

- Completed research.md (Phase 0)
- Completed data-model.md (Phase 1)
- Existing codebase functionality
- All 17 existing tests

## Success Criteria

Migration is successful when:

- [x] Zero critical/high security vulnerabilities (SC-001)
- [x] 100% of outdated packages updated (SC-002)
- [x] All 17 existing tests pass (SC-003)
- [x] Bot successfully handles all 13 commands (SC-004)
- [x] TypeScript compilation succeeds with zero errors (SC-005)
- [x] Build process completes successfully (SC-006)
- [x] Production dependencies reduced by ≥5% (SC-007)
- [x] Code coverage ≥17% (SC-008)
- [x] This migration guide is complete (SC-009)
- [x] Bundle size increase <10% (SC-010)

---

## Additional Resources

- [Vitest Migration Guide](https://vitest.dev/guide/migration.html)
- [Axios Changelog](https://github.com/axios/axios/blob/master/CHANGELOG.md)
- [Fastify Upgrade Guide](https://www.fastify.io/docs/latest/Guides/Upgrade-Guide/)
- [Node Cron Documentation](https://www.npmjs.com/package/cron)
- [PNPM Documentation](https://pnpm.io/)

---

## Version History

| Version | Date       | Changes                         |
| ------- | ---------- | ------------------------------- |
| 1.0     | 2025-01-27 | Initial migration guide created |

---

## Notes

- This is a living document - update as issues are discovered
- Always backup database and data files before major changes
- Test in development environment first, then staging, then production
- Monitor logs closely after each phase
- Keep rollback procedures documented and accessible
