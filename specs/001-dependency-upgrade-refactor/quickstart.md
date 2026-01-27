# Quick Start Guide: Dependency Upgrade and Code Cleanup Refactor

**Feature**: 001-dependency-upgrade-refactor
**Purpose**: Execute dependency upgrades and code cleanup efficiently
**Audience**: Developers performing upgrades
**Estimated Time**: 2-4 hours (depending on breaking changes)
**Last Updated**: 2025-01-27

## Prerequisites

Before starting, ensure:

- [ ] You have write access to the repository
- [ ] Current branch is `001-dependency-upgrade-refactor` (or create it)
- [ ] All uncommitted changes are committed or stashed
- [ ] You have pnpm installed: `pnpm --version` (should show version)
- [ ] You have Node.js 22.11.0+ installed: `node --version`
- [ ] You have reviewed the [migration guide](./contracts/migration-guide.md)
- [ ] You have reviewed [research.md](./research.md) for decisions made

**Setup**:

```bash
# Ensure you're on the correct branch
git checkout 001-dependency-upgrade-refactor

# Install dependencies (if not already)
pnpm install

# Run baseline tests
pnpm test

# Document current state
pnpm outdated > outdated-before.txt
pnpm audit > audit-before.txt
du -sh dist/ > bundle-size-before.txt
```

---

## Quick Overview

The upgrade process follows three phases:

1. **Phase A**: Security patches (CRITICAL) - ~30 minutes
2. **Phase B**: Major version updates (MEDIUM RISK) - ~1-2 hours
3. **Phase C**: Minor/patch updates + cleanup (LOW RISK) - ~30-60 minutes

**Total estimated time**: 2-4 hours

---

## Phase A: Security Patches (CRITICAL)

**Priority**: MUST complete first
**Risk**: Low (patch versions, no breaking changes expected)
**Time**: ~30 minutes

### A1. Upgrade vitest (Critical RCE Vulnerability)

```bash
# Update package.json
pnpm update vitest@^2.1.9

# Run tests
pnpm test

# If tests pass, commit
git add package.json pnpm-lock.yaml
git commit -m "security: upgrade vitest to 2.1.9 (fix GHSA-9crc-q9x8-hgqq - Remote Code Execution)"

# Verify vulnerability is fixed
pnpm audit
```

**Expected outcome**: All tests pass, no errors

**If tests fail**:

```bash
# Check test failures
# If minor, fix and commit
# If major, rollback:
git reset --hard HEAD^
pnpm install
# Report issue with details
```

---

### A2. Upgrade axios (High SSRF Vulnerability)

```bash
# Update package.json
pnpm update axios@^1.7.4

# Run tests
pnpm test

# Test RemoteService specifically (if integration tests exist)
# Or manually test: Start bot, test a command that uses RemoteService
pnpm start

# In another terminal, test website command or servers command

# If tests pass and bot works, commit
git add package.json pnpm-lock.yaml
git commit -m "security: upgrade axios to 1.7.4 (fix GHSA-8hc4-vh64-cxmj - Server-Side Request Forgery)"

# Verify vulnerability is fixed
pnpm audit
```

**Expected outcome**: All tests pass, RemoteService works, bot functions normally

**If tests fail**: Rollback as above and investigate

---

### A3. Upgrade fastify (High Content-Type Bypass)

```bash
# Update package.json
pnpm update fastify@^5.3.2

# Update @fastify/static to compatible version
pnpm update @fastify/static@^9.0.0

# Run tests
pnpm test

# Start bot and test basic functionality
pnpm start

# If tests pass and bot starts, commit
git add package.json pnpm-lock.yaml
git commit -m "security: upgrade fastify to 5.3.2 and @fastify/static to 9.0.0 (fix GHSA-mg2h-6x62-wpwc - Content-Type Parsing Bypass)"

# Verify vulnerabilities are fixed
pnpm audit
```

**Expected outcome**: All tests pass, bot starts, all commands work

**If tests fail**: Rollback as above and investigate

---

### Phase A Complete Check

```bash
# Verify all security patches are installed
pnpm audit

# Expected: No critical or high vulnerabilities

# Run all tests
pnpm test

# Expected: All 17 tests pass

# Build project
pnpm build

# Expected: No errors

# Start bot smoke test
pnpm start

# Expected: Bot starts without errors
```

**If Phase A is successful**: ✅ Proceed to Phase B
**If Phase A fails**: ❌ Rollback, investigate, report issues

---

## Phase B: Major Version Updates (MEDIUM RISK)

**Priority**: HIGH (after security patches)
**Risk**: Medium (breaking changes possible)
**Time**: ~1-2 hours

### Before Starting Phase B

For each package:

1. **Read migration guide** (provided in [migration-guide.md](./contracts/migration-guide.md))
2. **Identify breaking changes**
3. **Plan code updates if needed**

---

### B1. Upgrade cron (3.x → 4.4.0)

```bash
# Read cron v4 migration guide
# Link: https://www.npmjs.com/package/cron

# Update package.json
pnpm update cron@^4.4.0

# Check for breaking changes in code
grep -r "cron" src/

# If breaking changes exist, update affected code
# File: src/commands/servers/tasks/analyticsTask.ts
# File: src/commands/servers/tasks/analyticsHoursTask.ts

# Update code based on migration guide

# Run tests
pnpm test

# Start bot and test scheduled tasks
pnpm start

# If tests pass, commit
git add package.json pnpm-lock.yaml src/commands/servers/tasks/
git commit -m "upgrade: cron to 4.4.0 - [describe any code changes]"
```

**Expected outcome**: Tests pass, scheduled tasks execute correctly

**If breaking changes exist and tests fail**: Update code according to migration guide

---

### B2. Upgrade dotenv (16.x → 17.2.3)

```bash
# Read dotenv v17 migration guide
# Link: https://www.npmjs.com/package/dotenv

# Update package.json
pnpm update dotenv@^17.2.3

# Check for breaking changes
grep -r "dotenv" src/

# Update code if needed (file: src/utils/env.ts)

# Run tests
pnpm test

# Start bot and verify environment variables load
pnpm start

# If tests pass, commit
git add package.json pnpm-lock.yaml src/utils/env.ts
git commit -m "upgrade: dotenv to 17.2.3 - [describe any code changes]"
```

**Expected outcome**: Tests pass, environment variables load correctly

---

### B3. Upgrade fast-xml-parser (4.x → 5.3.3)

```bash
# Read fast-xml-parser v5 migration guide
# Link: https://github.com/NaturalIntelligence/fast-xml-parser

# Update package.json
pnpm update fast-xml-parser@^5.3.3

# Check for XML parsing usage
grep -r "XMLParser\|XMLBuilder" src/

# Update code if needed based on migration guide

# Run tests
pnpm test

# Test XML file loading
# (Any commands that use XML data files)

# If tests pass, commit
git add package.json pnpm-lock.yaml [affected files]
git commit -m "upgrade: fast-xml-parser to 5.3.3 - [describe any code changes]"
```

**Expected outcome**: Tests pass, XML files parse correctly

---

### B4. Upgrade @clickhouse/client (1.0.1 → 1.16.0)

```bash
# Read changelog for breaking changes
# Link: https://github.com/ClickHouse/clickhouse-js

# Update package.json
pnpm update @clickhouse/client@^1.16.0

# Check ClickHouse service usage
grep -r "clickhouse" src/

# Update code if needed (file: src/services/clickHouse.service.ts)

# Run tests
pnpm test

# Test ClickHouse connectivity
# (If you have a test ClickHouse instance)

# If tests pass, commit
git add package.json pnpm-lock.yaml src/services/clickHouse.service.ts
git commit -m "upgrade: @clickhouse/client to 1.16.0 - [describe any code changes]"
```

**Expected outcome**: Tests pass, ClickHouse queries work

---

### B5. Upgrade echarts (5.x → 6.0.0)

```bash
# Read echarts v6 migration guide
# Link: https://echarts.apache.org/handbook/en/concepts/upgrade

# Update package.json
pnpm update echarts@^6.0.0

# Check chart generation code
grep -r "echarts" src/

# Update code if needed (file: src/commands/servers/charts/chart.ts)

# Run tests
pnpm test

# Test chart generation
# (If possible, generate a server statistics chart)

# If tests pass, commit
git add package.json pnpm-lock.yaml src/commands/servers/charts/chart.ts
git commit -m "upgrade: echarts to 6.0.0 - [describe any code changes]"
```

**Expected outcome**: Tests pass, charts generate correctly

---

### B6. Upgrade canvas (3.1.0 → 3.2.1)

```bash
# No major breaking changes expected (patch version)

# Update package.json
pnpm update canvas@^3.2.1

# Run tests
pnpm test

# Test image generation commands
pnpm start

# Test TDoll command
# Test servers command (images)

# If tests pass, commit
git add package.json pnpm-lock.yaml
git commit -m "upgrade: canvas to 3.2.1"
```

**Expected outcome**: Tests pass, all images generate correctly

---

### Phase B Complete Check

```bash
# Run all tests
pnpm test

# Expected: All 17 tests pass

# Build project
pnpm build

# Expected: No errors

# Start bot
pnpm start

# Expected: Bot starts, all commands work
```

**If Phase B is successful**: ✅ Proceed to Phase C
**If Phase B fails**: ❌ Rollback specific package update, investigate breaking changes

---

## Phase C: Minor/Patch Updates + Cleanup (LOW RISK)

**Priority**: MEDIUM
**Risk**: Low (patch versions, minimal breaking changes)
**Time**: ~30-60 minutes

### C1. Batch Update Minor/Patch Packages

```bash
# Update all remaining outdated packages in one batch
pnpm update dayjs jsonwebtoken lodash pinyin-match tracer

# Run tests
pnpm test

# Build project
pnpm build

# If tests pass, commit
git add package.json pnpm-lock.yaml
git commit -m "chore: update dayjs, jsonwebtoken, lodash, pinyin-match, tracer to latest versions"
```

**Expected outcome**: All tests pass, no code changes needed

---

### C2. Update Development Dependencies

```bash
# Update all dev dependencies
pnpm update -D

# Run TypeScript compiler to check for type errors
tsc --noEmit

# If type errors appear:
# 1. Review and fix type errors
# 2. Update code as needed
# 3. Re-run tsc --noEmit

# Run tests
pnpm test

# If tests pass, commit
git add package.json pnpm-lock.yaml [any changed code]
git commit -m "chore: update all development dependencies to latest versions"
```

**Expected outcome**: TypeScript compiles with zero errors, all tests pass

**If type errors appear**: Fix type definitions or code as needed

---

### C3. Identify and Remove Unused Dependencies

```bash
# Install depcheck tool
pnpm add -D depcheck

# Run analysis
npx depcheck

# Review output:
# - Unused dependencies: Packages to remove
# - Missing dependencies: Packages to add (should be none)
# - Unused dev dependencies: Dev packages to remove

# For each unused dependency:
# 1. Verify it's truly unused (grep for imports)
# 2. Remove from package.json
# 3. Run tests

# Example: Remove unused production dependency
pnpm remove <unused-package-name>
pnpm test

# Example: Remove unused dev dependency
pnpm remove -D <unused-dev-package-name>
pnpm test

# Commit each removal (or batch if confident)
git add package.json pnpm-lock.yaml
git commit -m "chore: remove unused dependency <package-name>"
```

**Expected outcome**: At least 1-2 production dependencies removed (≥5% reduction)

---

### C4. Run Linter and Format Code

```bash
# Check code formatting
prettier --check .

# If formatting issues exist:
prettier --write .

# Commit formatting changes
git add .
git commit -m "style: format code with prettier"

# If linter exists and passes:
# pnpm run lint
```

**Expected outcome**: Code is consistently formatted

---

### Phase C Complete Check

```bash
# Run complete test suite
pnpm test

# Expected: All 17 tests pass

# Run coverage (optional)
pnpm run coverage

# Expected: Coverage >= 17% baseline

# Build project
pnpm build

# Expected: No errors, no warnings

# TypeScript check
tsc --noEmit

# Expected: Zero type errors

# Security audit
pnpm audit

# Expected: No critical or high vulnerabilities

# Check outdated packages
pnpm outdated

# Expected: All packages up to date (or only minor patch versions available)

# Measure bundle size
du -sh dist/

# Compare with bundle-size-before.txt
# Expected: <10% increase
```

**If Phase C is successful**: ✅ Proceed to Final Verification
**If Phase C fails**: ❌ Investigate and fix issues

---

## Final Verification

### Run Comprehensive Tests

```bash
# 1. All tests pass
pnpm test

# 2. TypeScript compilation succeeds
tsc --noEmit

# 3. Build succeeds
pnpm build

# 4. No security vulnerabilities
pnpm audit

# 5. Bot starts and functions
pnpm start

# Test all 13 commands:
# roll, tdoll, website, servers, setu, neko, touhou, waifu, ai, fuck, 1pt, qa, log, version
```

### Compare Before and After

```bash
# Compare security audits
diff audit-before.txt <(pnpm audit)

# Expected: No critical/high vulnerabilities after

# Compare outdated packages
diff outdated-before.txt <(pnpm outdated)

# Expected: All outdated packages updated

# Compare bundle size
diff bundle-size-before.txt <(du -sh dist/)

# Expected: <10% increase
```

### Document Results

Create a summary file `UPGRADE_RESULTS.md`:

```markdown
# Dependency Upgrade Results

Date: 2025-01-27

## Security Vulnerabilities Resolved

- vitest: GHSA-9crc-q9x8-hgqq (RCE)
- axios: GHSA-8hc4-vh64-cxmj (SSRF)
- fastify: GHSA-mg2h-6x62-wpwc (Content-Type bypass)
- tar-fs: GHSA-vj76-c3g6-qr5v (symlink bypass) - via canvas
- form-data: GHSA-fjxv-7rqg-78g4 (unsafe random) - via axios

## Packages Updated

- [List all packages with versions]

## Unused Dependencies Removed

- [List removed packages]

## Breaking Changes Encountered

- [List breaking changes and how they were resolved]

## Tests

- All 17 tests: PASS
- TypeScript compilation: PASS
- Build: PASS

## Bundle Size

- Before: [size]
- After: [size]
- Change: [percentage]

## Issues

- [List any issues and resolutions]
```

---

## Rollback Guide (If Needed)

### Rollback Single Package

```bash
# View recent commits
git log --oneline -10

# Revert specific commit
git revert <commit-hash>

# Or reset (if not pushed)
git reset --hard <commit-before-problematic-update>
pnpm install
pnpm test
```

### Rollback Everything

```bash
# Reset to pre-upgrade state
git log --oneline -20
# Find commit before any upgrades

git reset --hard <pre-upgrade-commit>
pnpm install

# Verify baseline
pnpm test
pnpm build
```

---

## Troubleshooting

### Tests Fail After Upgrade

1. **Check test failures**: Review which tests fail
2. **Check breaking changes**: Did the package introduce breaking changes?
3. **Check code**: Do you need to update code to use new APIs?
4. **Read documentation**: Check package documentation and migration guide
5. **Search issues**: Look up the issue in package GitHub issues

**Solution**: Update code according to migration guide, add/update tests

### TypeScript Compilation Fails

1. **Check type errors**: Review which files have type errors
2. **Update types**: May need to update @types/\* packages
3. **Fix code**: Update code to match new type definitions
4. **Use any**: As last resort, use `// @ts-ignore` (but avoid)

**Solution**: Fix type definitions or code to resolve errors

### Bot Won't Start After Upgrade

1. **Check startup logs**: Look for errors in console output
2. **Check dependencies**: Are all dependencies installed?
3. **Check environment variables**: Did dotenv update break anything?
4. **Test in isolation**: Try starting with minimal configuration

**Solution**: Identify breaking startup issue, rollback if critical

### Security Vulnerability Persists After Upgrade

1. **Check transitive dependencies**: Some vulnerabilities are in transitive deps
2. **Update parent package**: Updating parent should update transitive
3. **Check lockfile**: Ensure lockfile is updated (pnpm install)
4. **Run audit again**: pnpm audit

**Solution**: Update parent package, reinstall dependencies

---

## Next Steps After Success

1. **Create pull request**: Merge `001-dependency-upgrade-refactor` to master
2. **Update CHANGELOG.md**: Document dependency upgrades
3. **Monitor production**: Watch for any issues after deployment
4. **Schedule next upgrade**: Plan regular dependency updates (monthly recommended)

---

## Checklist Summary

### Phase A: Security Patches

- [ ] vitest upgraded and tested
- [ ] axios upgraded and tested
- [ ] fastify upgraded and tested
- [ ] All Phase A tests pass
- [ ] All Phase A vulnerabilities resolved

### Phase B: Major Updates

- [ ] cron upgraded and tested
- [ ] dotenv upgraded and tested
- [ ] fast-xml-parser upgraded and tested
- [ ] @clickhouse/client upgraded and tested
- [ ] echarts upgraded and tested
- [ ] canvas upgraded and tested
- [ ] All Phase B tests pass

### Phase C: Minor/Patch + Cleanup

- [ ] Minor packages batch updated and tested
- [ ] Dev dependencies updated and tested
- [ ] Unused dependencies identified and removed
- [ ] Code formatted with linter
- [ ] All Phase C tests pass

### Final Verification

- [ ] All 17 tests pass
- [ ] TypeScript compilation succeeds (zero errors)
- [ ] Build succeeds (no errors/warnings)
- [ ] No critical/high security vulnerabilities
- [ ] All packages up to date
- [ ] Bundle size increase <10%
- [ ] Production dependencies reduced by ≥5%
- [ ] Bot starts and all 13 commands work

### Documentation

- [ ] Migration guide updated with any issues found
- [ ] UPGRADE_RESULTS.md created
- [ ] Pull request created with detailed description

---

## Support

If you encounter issues:

1. Check [migration guide](./contracts/migration-guide.md) for detailed information
2. Check [research.md](./research.md) for decisions made
3. Review package documentation and migration guides
4. Search GitHub issues for the specific package
5. Ask for help in team channels

---

**Good luck!** This upgrade process will improve security, fix bugs, and reduce technical debt. Take your time, test thoroughly, and commit frequently for easy rollback.

---

**Estimated completion time**: 2-4 hours
**Risk level**: MEDIUM (mainly from major version upgrades)
**Rollback difficulty**: LOW (atomic commits make it easy)

---

**Remember**: Test after each phase, commit frequently, and don't hesitate to rollback if something doesn't work!
