# Tasks: 迁移图像渲染依赖到 skia-canvas

**Input**: Design documents from `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/specs/002-migrate-skia-canvas/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Included (FR-005 requires a repeatable image regression sample set runnable locally + CI)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format

Each task follows:

`- [ ] T### [P?] [US?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US#]**: Only for user story phases
- **File paths**: Always included

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare dependency + build/CI/Docker surfaces for the migration

- [x] T001 Review migration decisions + constraints in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/specs/002-migrate-skia-canvas/research.md`
- [x] T002 Update deps to target renderer in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/package.json` (remove `canvas`, add `skia-canvas@3.0.8`, update `pnpm.onlyBuiltDependencies`)
- [x] T003 [P] Update dependency metadata in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/info.json` (replace `canvas` entry with `skia-canvas@3.0.8`)
- [x] T004 Refresh lockfile after dependency switch in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/pnpm-lock.yaml` (via `pnpm install`)
- [x] T005 [P] Remove node-canvas system deps step from CI in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/.github/workflows/ci.yml` and ensure install stage still succeeds with pnpm
- [x] T006 [P] Remove node-canvas build deps and install workaround in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/Dockerfile` (stop `cd node_modules/canvas && npm run install`, adjust apk deps)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared renderer abstraction + error/logging hooks used by all image code paths

**CRITICAL**: No user story work should begin until this phase is complete

- [x] T007 Create renderer abstraction in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/canvasBackend.ts` (typed `createCanvas/loadImage/toPngBuffer` facade over `skia-canvas`)
- [x] T008 [P] Define typed render error model in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRenderErrors.ts` (error codes + context payload for FR-004)
- [x] T009 [P] Implement render logging helper in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRenderLogger.ts` using existing tracer logger (`/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/utils/logger.ts`)
- [x] T010 Create shared font bootstrap for stable rendering in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/canvasFonts.ts` (env-first, no required user config)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - CI 流水线依赖安装稳定 (Priority: P1)

**Goal**: CI install stage becomes stable by removing `canvas` and using `skia-canvas@3.0.8` end-to-end

**Independent Test**: Re-run GitHub Actions workflow (`/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/.github/workflows/ci.yml`) multiple times; dependency install step succeeds and (over 20 runs) failures are <= 1.

### Tests for User Story 1

- [x] T011 [P] [US1] Add a minimal runtime smoke test that imports the backend in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/canvasBackend.test.ts` (ensures module loads + can create a tiny PNG)

### Implementation for User Story 1

- [x] T012 [US1] Replace node-canvas types/encoding in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/baseCanvas.ts` to use `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/canvasBackend.ts` (no `Canvas.PNG_FILTER_*`)
- [x] T013 [P] [US1] Migrate image loading service in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/canvasImg.service.ts` to use `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/canvasBackend.ts`
- [x] T014 [P] [US1] Migrate ECharts bitmap rendering imports/encoding in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/servers/charts/chart.ts` to remove `from 'canvas'` (keep behavior equivalent for now)
- [x] T015 [P] [US1] Migrate servers canvas renderers in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/servers/canvas/mapsCanvas.ts` (imports + encoding)
- [x] T016 [P] [US1] Migrate servers canvas renderers in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/servers/canvas/playersCanvas.ts` (imports + encoding)
- [x] T017 [P] [US1] Migrate servers canvas renderers in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/servers/canvas/serversCanvas.ts` (imports + encoding)
- [x] T018 [P] [US1] Migrate servers canvas renderers in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/servers/canvas/whereisCanvas.ts` (imports + encoding)
- [x] T019 [P] [US1] Migrate tdoll renderer in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/tdoll/canvas/tdoll2Canvas.ts` (imports + encoding)
- [x] T020 [P] [US1] Migrate tdoll renderer in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/tdoll/canvas/tdollSkin2Canvas.ts` (imports + encoding)
- [x] T021 [US1] Remove remaining `from 'canvas'` imports across `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/**` (verify via ripgrep)
- [x] T022 [P] [US1] Update unit tests that mock canvas in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/baseCanvas.test.ts` to mock `skia-canvas` (or the new backend facade)
- [x] T023 [P] [US1] Update unit tests that mock canvas in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/tdoll/canvas/tdoll2Canvas.test.ts` to mock `skia-canvas` (or the new backend facade)
- [x] T024 [P] [US1] Update unit tests that mock canvas in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/tdoll/canvas/tdollSkin2Canvas.test.ts` to mock `skia-canvas` (or the new backend facade)
- [x] T025 [P] [US1] Update unit tests that mock canvas in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/servers/canvas/mapsCanvas.test.ts` to mock `skia-canvas` (or the new backend facade)
- [x] T026 [US1] Ensure CI still runs coverage successfully via `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/vitest.config.ts` (no worker pool crashes due to native module)

**Checkpoint**: CI install stage should be stable and pipeline should proceed beyond dependency installation

---

## Phase 4: User Story 2 - 现有图片生成功能保持可用 (Priority: P2)

**Goal**: All existing image generation features still produce usable images; failures are logged with actionable context

**Independent Test**: Run a local + CI image regression suite (>=3 scenarios) and confirm outputs are non-empty, openable PNGs without obvious missing text/graphics

### Tests for User Story 2 (FR-005)

- [x] T027 [P] [US2] Add image regression scenario registry in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRegression/scenarios.ts` (>=3 scenarios: tdoll + servers map + chart)
- [x] T028 [P] [US2] Add PNG diff utilities in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRegression/pngDiff.ts` (pixelmatch-style threshold + artifact writing)
- [x] T029 [US2] Add Vitest runner for regression suite in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRegression/imageRegression.test.ts` gated by `RUN_IMAGE_TESTS=1`
- [x] T030 [P] [US2] Add golden + fixture directory README in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRegression/README.md` (how to update goldens using `UPDATE_IMAGE_GOLDENS=1`)

### Implementation for User Story 2

- [x] T031 [US2] Make footer deterministic/disable-able for tests in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/baseCanvas.ts` (default behavior unchanged; tests control via env)
- [x] T032 [US2] Ensure fonts are stable in CI by wiring `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/canvasFonts.ts` into the image render entrypoints (no required user config)
- [x] T033 [US2] Standardize error handling for all image render paths using `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRenderErrors.ts` + `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRenderLogger.ts`
- [x] T034 [P] [US2] Update ECharts rendering to SVG SSR in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/servers/charts/chart.ts` and rasterize to PNG without node-canvas
- [x] T035 [P] [US2] Update ECharts tests to cover SVG SSR path in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/servers/charts/chart.test.ts`
- [x] T036 [P] [US2] Add regression fixtures for servers data in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRegression/fixtures/servers/` (JSON + any needed assets)
- [x] T037 [P] [US2] Add regression fixtures for tdoll data in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRegression/fixtures/tdoll/` (JSON + any needed assets)
- [x] T038 [P] [US2] Add regression fixtures for charts data in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRegression/fixtures/charts/` (JSON)
- [x] T039 [US2] Run regression suite locally and fix any rendering drift in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRegression/imageRegression.test.ts`

**Checkpoint**: Regression suite passes locally + in CI; image outputs are usable and errors are actionable

---

## Phase 5: User Story 3 - 开发者本地安装体验改善 (Priority: P3)

**Goal**: Fresh clone installs without manual system-level graphics dependencies; Docker build no longer compiles node-canvas

**Independent Test**: In a clean environment, `pnpm install` succeeds and image regression suite can run

### Implementation for User Story 3

- [x] T040 [US3] Update developer docs to reflect new renderer + no Cairo deps in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/README.md`
- [x] T041 [US3] Ensure Docker build uses `skia-canvas` only in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/Dockerfile` (remove canvas-specific apk deps and install script)
- [x] T042 [US3] Add a dedicated local verification command in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/package.json` (e.g. `test:image` toggling `RUN_IMAGE_TESTS=1`)
- [x] T043 [US3] Document local verification flow in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/specs/002-migrate-skia-canvas/quickstart.md`

**Checkpoint**: Fresh install works; Docker build no longer depends on node-canvas toolchain

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks, cleanup, and validation

- [x] T044 [P] Remove any remaining references to `canvas` package in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/package.json` and `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/pnpm-lock.yaml`
- [x] T045 [P] Ensure image failures never crash process by auditing entrypoints in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/index.ts` (uncaught handlers remain) and adding local try/catch where needed
- [x] T046 [P] Update CI runtime steps to match new install needs in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/.github/workflows/ci.yml` (remove now-unused apt packages)
- [x] T047 Run full suite (`pnpm test`, `pnpm run coverage`, `pnpm run build`) using scripts in `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/package.json` and fix failures

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) -> Foundational (Phase 2) -> User stories (Phase 3/4/5) -> Polish (Phase 6)

### User Story Dependencies

- US1 (P1): Depends on Phase 1-2; unblocks removing node-canvas in CI/Docker
- US2 (P2): Depends on US1 completing migration; adds regression suite + behavior validation
- US3 (P3): Depends on US1; mainly documentation + Docker/local ergonomics

### Within Each User Story

- Tests/harness first (when required), then implementation, then run/validate

---

## Parallel Examples

### User Story 1

```text
Task: "Migrate servers canvas renderers in /Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/servers/canvas/mapsCanvas.ts"
Task: "Migrate servers canvas renderers in /Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/servers/canvas/playersCanvas.ts"
Task: "Migrate tdoll renderer in /Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/tdoll/canvas/tdoll2Canvas.ts"
Task: "Migrate tdoll renderer in /Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/commands/tdoll/canvas/tdollSkin2Canvas.ts"
```

### User Story 2

```text
Task: "Add image regression scenario registry in /Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRegression/scenarios.ts"
Task: "Add PNG diff utilities in /Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRegression/pngDiff.ts"
Task: "Add regression fixtures for charts data in /Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/src/services/imageRegression/fixtures/charts/"
```

### User Story 3

```text
Task: "Update developer docs in /Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/README.md"
Task: "Ensure Docker build uses skia-canvas only in /Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/Dockerfile"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1-2
2. Complete US1 tasks (Phase 3)
3. Validate CI install stability via `/Users/zhao/Documents/personal-projects/rwr-imba-qq-bot/.github/workflows/ci.yml`

### Incremental Delivery

1. US1: dependency migration + CI/Docker stability
2. US2: regression suite + output correctness
3. US3: local developer experience + docs
