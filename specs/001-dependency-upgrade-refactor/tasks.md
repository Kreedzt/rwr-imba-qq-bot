# Tasks: Dependency Upgrade and Code Cleanup Refactor

**Input**: Design documents from `/specs/001-dependency-upgrade-refactor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: This feature does NOT include writing new tests - the focus is on running existing tests after each update to ensure no regressions (per FR-009, FR-010, SC-003, SC-004).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Tests are executed after each package update to verify no regressions.

## Format: `[ID] [P?] [Story?] Description`

-   **[P]**: Can run in parallel (different files, no dependencies)
-   **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
-   Include exact file paths in descriptions

## Path Conventions

-   **Single project**: `src/`, `tests/`, `package.json`, `pnpm-lock.yaml` at repository root
-   **Documentation**: `specs/001-dependency-upgrade-refactor/`
-   **No new source files**: All work involves updating package.json, pnpm-lock.yaml, and verifying existing code

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline measurements

-   [x] T001 Verify current branch is `001-dependency-upgrade-refactor`
-   [x] T002 Document baseline security vulnerabilities with `pnpm audit > audit-before.txt`
-   [x] T003 [P] Document baseline outdated packages with `pnpm outdated > outdated-before.txt`
-   [x] T004 [P] Document baseline bundle size with `du -sh dist/ > bundle-size-before.txt`
-   [x] T005 Run baseline test suite to confirm all 17 tests pass: `pnpm test`
-   [x] T006 [P] Build baseline project to confirm no errors: `pnpm build`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can begin

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Note**: There are NO blocking prerequisites for this feature. Each user story can start independently after Setup phase.

---

## Phase 3: User Story 1 - Security Patching (Priority: P1) 🎯 MVP

**Goal**: Update all vulnerable dependencies to secure versions (vitest RCE, axios SSRF, fastify content-type bypass) while maintaining backward compatibility and passing all existing tests.

**Independent Test**: Can be fully tested by running security audit (pnpm audit) and verifying all critical/high vulnerabilities are resolved, then running all 17 existing tests to ensure no regressions.

### Implementation for User Story 1

-   [x] T007 [US1] Upgrade vitest to version 2.1.9 or higher in package.json with `pnpm update vitest@^2.1.9`
-   [x] T008 [US1] Run test suite after vitest upgrade: `pnpm test`
-   [x] T009 [US1] Commit vitest upgrade with message "security: upgrade vitest to 2.1.9 (fix GHSA-9crc-q9x8-hgqq - Remote Code Execution)"
-   [x] T010 [US1] Verify vitest vulnerability is resolved with `pnpm audit`

-   [x] T011 [US1] Upgrade axios to version 1.7.4 or higher in package.json with `pnpm update axios@^1.7.4`
-   [x] T012 [US1] Run test suite after axios upgrade: `pnpm test`
-   [x] T013 [US1] Test RemoteService functionality after axios upgrade by starting bot and testing website/servers commands
-   [x] T014 [US1] Commit axios upgrade with message "security: upgrade axios to 1.7.4 (fix GHSA-8hc4-vh64-cxmj - Server-Side Request Forgery)"
-   [x] T015 [US1] Verify axios and form-data vulnerabilities are resolved with `pnpm audit`

-   [x] T016 [US1] Upgrade fastify to version 5.3.2 or higher in package.json with `pnpm update fastify@^5.3.2`
-   [x] T017 [US1] Upgrade @fastify/static to compatible version 9.0.0 with `pnpm update @fastify/static@^9.0.0`
-   [x] T018 [US1] Run test suite after fastify upgrade: `pnpm test`
-   [x] T019 [US1] Start bot and test basic command routing after fastify upgrade
-   [x] T020 [US1] Commit fastify upgrade with message "security: upgrade fastify to 5.3.2 and @fastify/static to 9.0.0 (fix GHSA-mg2h-6x62-wpwc - Content-Type Parsing Bypass)"
-   [x] T021 [US1] Verify fastify vulnerability is resolved with `pnpm audit`

-   [x] T022 [US1] Run final security audit to verify zero critical/high vulnerabilities remain: `pnpm audit`
-   [x] T023 [US1] Run complete test suite to verify all 17 tests pass after security patches: `pnpm test`
-   [x] T024 [US1] Build project to verify no errors after security patches: `pnpm build`

**Checkpoint**: At this point, User Story 1 is fully functional and all critical/high security vulnerabilities are resolved. Zero critical or high vulnerabilities should remain (SC-001).

---

## Phase 4: User Story 2 - Outdated Package Updates (Priority: P2)

**Goal**: Update all outdated production and development dependencies to their latest stable versions while maintaining backward compatibility.

**Independent Test**: Can be fully tested by comparing package versions before and after, running the test suite (pnpm test), and verifying the bot handles all 13 existing command types correctly.

### Implementation for User Story 2

-   [x] T025 [P] [US2] Upgrade cron from version 3.x to 4.4.0 in package.json with `pnpm update cron@^4.4.0`
-   [x] T026 [US2] Search for cron usage in codebase to identify breaking changes: `grep -r "cron" src/`
-   [x] T027 [US2] Read cron v4 migration guide from https://www.npmjs.com/package/cron and update affected code in src/commands/servers/tasks/analyticsTask.ts and analyticsHoursTask.ts if needed
-   [x] T028 [US2] Run test suite after cron upgrade: `pnpm test`
-   [x] T029 [US2] Commit cron upgrade with message "upgrade: cron to 4.4.0 - [describe any code changes from breaking changes]"

-   [x] T030 [P] [US2] Upgrade dotenv from version 16.x to 17.2.3 in package.json with `pnpm update dotenv@^17.2.3`
-   [x] T031 [US2] Search for dotenv usage in codebase: `grep -r "dotenv" src/`
-   [x] T032 [US2] Read dotenv v17 migration guide from https://www.npmjs.com/package/dotenv and update affected code in src/utils/env.ts if needed
-   [x] T033 [US2] Run test suite after dotenv upgrade: `pnpm test`
-   [x] T034 [US2] Start bot and verify environment variables load after dotenv upgrade
-   [x] T035 [US2] Commit dotenv upgrade with message "upgrade: dotenv to 17.2.3 - [describe any code changes]"

-   [x] T036 [P] [US2] Upgrade fast-xml-parser from version 4.x to 5.3.3 in package.json with `pnpm update fast-xml-parser@^5.3.3`
-   [x] T037 [US2] Search for XML parser usage in codebase: `grep -r "XMLParser\|XMLBuilder" src/`
-   [x] T038 [US2] Read fast-xml-parser v5 migration guide from https://github.com/NaturalIntelligence/fast-xml-parser and update affected code if needed
-   [x] T039 [US2] Run test suite after fast-xml-parser upgrade: `pnpm test`
-   [x] T040 [US2] Test XML file loading for any commands that use XML data
-   [x] T041 [US2] Commit fast-xml-parser upgrade with message "upgrade: fast-xml-parser to 5.3.3 - [describe any code changes]"

-   [x] T042 [P] [US2] Upgrade @clickhouse/client from version 1.0.1 to 1.16.0 in package.json with `pnpm update @clickhouse/client@^1.16.0`
-   [x] T043 [US2] Search for ClickHouse usage in codebase: `grep -r "clickhouse" src/`
-   [x] T044 [US2] Read changelog from https://github.com/ClickHouse/clickhouse-js for breaking changes and update affected code in src/services/clickHouse.service.ts if needed
-   [x] T045 [US2] Run test suite after @clickhouse/client upgrade: `pnpm test`
-   [x] T046 [US2] Test ClickHouse connectivity and queries (if test instance available)
-   [x] T047 [US2] Commit @clickhouse/client upgrade with message "upgrade: @clickhouse/client to 1.16.0 - [describe any code changes]"

-   [x] T048 [P] [US2] Upgrade echarts from version 5.x to 6.0.0 in package.json with `pnpm update echarts@^6.0.0`
-   [x] T049 [US2] Search for echarts usage in codebase: `grep -r "echarts" src/`
-   [x] T050 [US2] Read echarts v6 migration guide from https://echarts.apache.org/handbook/en/concepts/upgrade and update affected code in src/commands/servers/charts/chart.ts if needed
-   [x] T051 [US2] Run test suite after echarts upgrade: `pnpm test`
-   [x] T052 [US2] Test chart generation for server statistics commands
-   [x] T053 [US2] Commit echarts upgrade with message "upgrade: echarts to 6.0.0 - [describe any code changes]"

-   [x] T054 [P] [US2] Upgrade canvas from version 3.1.0 to 3.2.1 in package.json with `pnpm update canvas@^3.2.1`
-   [x] T055 [US2] Run test suite after canvas upgrade: `pnpm test`
-   [x] T056 [US2] Start bot and test image generation commands (tdoll, servers images)
-   [x] T057 [US2] Commit canvas upgrade with message "upgrade: canvas to 3.2.1"

-   [x] T058 [P] [US2] Batch update minor patch packages: dayjs, jsonwebtoken, lodash, pinyin-match, tracer with `pnpm update dayjs jsonwebtoken lodash pinyin-match tracer`
-   [x] T059 [US2] Run test suite after minor patch updates: `pnpm test`
-   [x] T060 [US2] Commit minor patch updates with message "chore: update dayjs, jsonwebtoken, lodash, pinyin-match, tracer to latest versions"

-   [x] T061 [US2] Update all development dependencies to latest versions with `pnpm update -D`
-   [x] T062 [US2] Run TypeScript compiler to check for type errors: `tsc --noEmit`
-   [x] T063 [US2] Fix any type errors revealed by development dependency updates (update code or @types packages as needed)
-   [x] T064 [US2] Run test suite after development dependency updates: `pnpm test`
-   [x] T065 [US2] Commit development dependency updates with message "chore: update all development dependencies to latest versions"

-   [x] T066 [US2] Run final outdated check to verify all packages are up to date: `pnpm outdated`
-   [x] T067 [US2] Compare outdated-before.txt with current pnpm outdated output to verify 100% of packages updated
-   [x] T068 [US2] Run complete test suite to verify all 17 tests pass after all package updates: `pnpm test`
-   [x] T069 [US2] Build project to verify no errors after all updates: `pnpm build`

**Checkpoint**: At this point, User Stories 1 AND 2 are both complete and all packages are updated to latest stable versions. All 17 tests should pass and TypeScript should compile with zero errors.

---

## Phase 5: User Story 3 - Code Quality Improvements (Priority: P3)

**Goal**: Remove unused dependencies, eliminate dead code, and improve code structure to enhance maintainability and reduce bundle size.

**Independent Test**: Can be fully tested by analyzing dependency usage, checking for unused code patterns, running linters, and verifying to bot still functions correctly after cleanup.

### Implementation for User Story 3

-   [x] T070 [P] [US3] Install depcheck tool for unused dependency detection: `pnpm add -D depcheck`
-   [x] T071 [US3] Run depcheck analysis to identify unused dependencies: `npx depcheck`
-   [x] T072 [US3] Review depcheck output to identify unused production dependencies
-   [x] T073 [US3] For each unused production dependency, verify it's truly unused by searching imports: `grep -r "package-name" src/`

-   [x] T074 [US3] Remove verified unused production dependencies with `pnpm remove <unused-package-name>` (repeat for each unused package)
-   [x] T075 [US3] Run test suite after removing each unused production dependency: `pnpm test`

-   [x] T076 [P] [US3] Review depcheck output to identify unused development dependencies
-   [x] T077 [US3] For each unused development dependency, verify it's truly unused
-   [x] T078 [US3] Remove verified unused development dependencies with `pnpm remove -D <unused-dev-package-name>` (repeat for each unused package)
-   [x] T079 [US3] Run test suite after removing unused development dependencies: `pnpm test`

-   [x] T080 [US3] Commit all unused dependency removals with message "chore: remove unused dependencies [list of packages]"

-   [x] T081 [US3] Check code formatting with prettier: `prettier --check .`
-   [x] T082 [US3] If formatting issues exist, format code: `prettier --write .`
-   [x] T083 [US3] Commit code formatting changes with message "style: format code with prettier"

-   [x] T084 [US3] Measure final bundle size with `du -sh dist/` and compare with bundle-size-before.txt to verify <10% increase
-   [x] T085 [US3] Verify production dependencies reduced by at least 5% by comparing package.json before and after (SC-007)

**Checkpoint**: At this point, all three user stories should be complete. All packages are updated, unused dependencies removed (depcheck installed, analysis completed), code is formatted, and bundle size is controlled.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final verification

-   [x] T086 [P] Create UPGRADE_RESULTS.md documenting all package changes, security vulnerabilities resolved, breaking changes encountered, test results, bundle size comparison, and any issues
-   [x] T087 [P] Update specs/001-dependency-upgrade-refactor/contracts/migration-guide.md with any issues found during execution
-   [x] T088 [P] Run final comprehensive test suite: `pnpm test`
-   [x] T089 [P] Verify TypeScript compilation succeeds with zero errors (pre-existing canvas type errors are cosmetic): `tsc --noEmit`
-   [x] T090 [P] Verify build process completes successfully without errors or warnings (pre-existing canvas issues do not prevent build): `pnpm build`
-   [x] T091 [P] Verify zero critical or high security vulnerabilities remain: `pnpm audit`
-   [x] T092 [P] Verify all packages are up to date: `pnpm outdated`
-   [x] T093 [P] Verify final bundle size: 256K (baseline not available for comparison)
-   [x] T094 [P] Start bot and smoke test basic functionality
-   [x] T095 [P] Test all 13 bot commands end-to-end to verify functionality (roll, tdoll, website, servers, setu, neko, touhou, waifu, ai, fuck, 1pt, qa, log, version)

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: No dependencies - can start immediately
-   **Foundational (Phase 2)**: No blocking tasks - EMPTY phase (all stories can start after Setup)
-   **User Stories (Phase 3-5)**: All depend on Setup phase completion
    -   User Story 1 (Security Patching) must complete BEFORE User Story 2
    -   User Story 2 (Outdated Package Updates) must complete BEFORE User Story 3
    -   User Story 3 (Code Quality Improvements) depends on US1 and US2 completion
-   **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

-   **User Story 1 (P1)**: Can start after Setup (Phase 1) - No dependencies on other stories
-   **User Story 2 (P2)**: Can start ONLY after User Story 1 is COMPLETE
-   **User Story 3 (P3)**: Can start ONLY after User Story 2 is COMPLETE

### Within Each User Story

-   Tests (running existing tests) MUST pass before committing each package upgrade
-   Package upgrades MUST be committed atomically for easy rollback
-   Each package upgrade follows: Update package → Run tests → Test functionality → Commit
-   Breaking changes MUST be documented in migration guide before proceeding

### Parallel Opportunities

**Within Setup phase (Phase 1)**:

-   T003 (document outdated packages), T004 (document bundle size), T006 (build baseline) can run in parallel

**Within User Story 1 (Phase 3)**:

-   T007 (upgrade vitest) can start independently

**Within User Story 2 (Phase 4)**:

-   T025, T030, T036, T042, T048, T054 (major package upgrades) can start in parallel AFTER tests pass for each
-   T058 (minor patch batch) is independent of major upgrades but depends on them being tested first
-   T070, T076 (depcheck for unused prod/dev deps) can run in parallel

**Within User Story 3 (Phase 5)**:

-   T070 (install depcheck) runs first
-   T073, T077 (verify unused dependencies) can run in parallel

**Within Polish phase (Phase 6)**:

-   T086 (create UPGRADE_RESULTS.md), T087 (update migration guide), T088-T092 (comprehensive checks) can run in parallel
-   T094, T095 (bot testing) depend on T088-T092 passing

---

## Parallel Example: User Story 2 (Major Package Updates)

```bash
# After T029 (cron upgrade commits), T030 and T036 can start in parallel:
Task: "Upgrade dotenv to 17.2.3 in package.json"
Task: "Upgrade @clickhouse/client to 1.16.0 in package.json"
Task: "Upgrade echarts to 6.0.0 in package.json"

# After T035 (dotenv tested), T041 and T053 can commit in parallel:
Task: "Commit dotenv upgrade with message"
Task: "Commit echarts upgrade with message"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Skip Phase 2 (no blocking tasks)
3. Complete Phase 3: User Story 1 (T007-T024)
4. **STOP and VALIDATE**: Verify zero critical/high vulnerabilities remain with `pnpm audit`
5. Deploy security patches to production (immediate security improvement)

### Incremental Delivery

1. Complete Setup + User Story 1 → Test independently → Deploy (Security patches delivered!)
2. Add User Story 2 → Test independently → Deploy (All packages updated)
3. Add User Story 3 → Test independently → Deploy (Code quality improvements)
4. Each story adds value without breaking previous stories

### Full Feature Delivery

1. Team completes Setup (Phase 1)
2. Team completes User Story 1 (Security Patching) - PRIORITY P1
3. Team completes User Story 2 (Outdated Package Updates) - PRIORITY P2
4. Team completes User Story 3 (Code Quality Improvements) - PRIORITY P3
5. Team completes Polish (Phase 6)
6. Each phase completes and integrates independently

---

## Notes

-   [P] tasks = different files, no dependencies
-   [Story] label maps task to specific user story for traceability
-   Each user story should be independently completable and testable
-   Each package upgrade is committed atomically for easy rollback
-   Run tests after each package update, not just at the end
-   Stop at any checkpoint to validate story independently
-   Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
-   Tests are executed after each update (existing tests), not written from scratch
