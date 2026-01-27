# Implementation Plan: 迁移图像渲染依赖到 skia-canvas

**Branch**: `002-migrate-skia-canvas` | **Date**: 2026-01-27 | **Spec**: `specs/002-migrate-skia-canvas/spec.md`
**Input**: Feature specification from `specs/002-migrate-skia-canvas/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

将项目内所有依赖 `canvas`(node-canvas/Cairo) 的图片渲染能力迁移到 `skia-canvas@3.0.8`，以消除 GitHub Actions 中因系统依赖/原生编译导致的安装不稳定问题，同时通过可重复执行的图片回归样例集保证迁移后输出可用且行为一致。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict) + Node.js 22.11.0  
**Primary Dependencies**: Fastify, tracer, pnpm, Vitest, (current) `canvas@3.2.1` → (target) `skia-canvas@3.0.8`  
**Storage**: Files (out/), optional ClickHouse (analytics)  
**Testing**: Vitest (`pnpm test`, `pnpm run coverage`)  
**Target Platform**: Local dev (macOS), CI (GitHub Actions `ubuntu-latest`)  
**Project Type**: single Node.js service (Fastify webhook + command modules)  
**Performance Goals**: image operations <= 30s (constitution); non-image <= 5s  
**Constraints**: 1) 不改变对外命令/输出语义；2) 不引入新的必需用户配置步骤；3) CI 安装阶段稳定性优先（>=95%/20 runs）  
**Scale/Scope**: 迁移所有图片相关渲染入口（Canvas 基类、TDoll、Servers maps/players/whereis、ECharts 图表）并新增>=3条图片回归样例集

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- ✅ **I. Modular Command System**: 迁移只在共享渲染服务层做适配，不引入跨 command 直接依赖；回归样例通过独立 harness 调用具体渲染模块。
- ✅ **II. Type Safety & Strict Mode**: 迁移新增的渲染适配层提供显式类型（避免 `any`），保证 `tsc` strict 通过。
- ✅ **III. Environment-First Configuration**: 任何渲染相关配置（字体路径、输出目录等）继续走 env（GlobalEnv）或默认值，不硬编码 secrets/URL。
- ✅ **IV. Observability & Logging**: 图片生成失败必须写结构化日志（含场景标识/原因概述），便于定位 CI / 线上问题。
- ✅ **V. Graceful Degradation & Error Handling**: 迁移不允许未捕获异常导致进程崩溃；图片失败返回可读错误并记录上下文。
- ⚠️ **VI. Image Generation via Canvas**: 宪法要求使用 `canvas` 包，但本需求要求迁移到 `skia-canvas@3.0.8`。
    - Gate decision: **允许带理由的偏离**（见下方 Complexity Tracking），以解决 CI 原生依赖安装不稳定这一 P1 痛点；同时保留 HTML5 Canvas 2D API 形态（通过适配层）以降低对 command 实现的影响。
- ✅ **VII. Testing Discipline**: 新增图片回归样例集与 Vitest 集成（可在本地与 CI 运行）。

## Project Structure

### Documentation (this feature)

```text
specs/002-migrate-skia-canvas/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── commands/
├── services/
├── utils/
└── types.ts
```

**Structure Decision**: 单仓单服务结构；迁移在 `src/services/` 添加渲染适配层，并逐步替换 `src/**` 中对 `canvas` 的直接引用。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                       | Why Needed                                                                | Simpler Alternative Rejected Because                                                                           |
| ------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| VI. Image Generation via Canvas | 需求明确要求迁移到 `skia-canvas@3.0.8` 以提升 CI 安装稳定性并减少系统依赖 | 继续使用 `canvas` 无法解决“依赖安装阶段频繁失败”的根因；仅靠 CI 预装 apt 依赖仍会受 runner 镜像/系统库波动影响 |
