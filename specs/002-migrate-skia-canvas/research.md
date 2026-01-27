# Phase 0 Research: 迁移到 skia-canvas

## Scope

- Goal: 将图片渲染依赖从 `canvas`(node-canvas/Cairo) 迁移到 `skia-canvas@3.0.8`，提升 GitHub Actions 依赖安装阶段稳定性；保持现有图片输出可用。
- Non-goals: 新增图片功能、重做视觉设计、改变对外命令/HTTP API 行为。

## Decisions

### 1) Rendering dependency choice

- Decision: 使用 `skia-canvas@3.0.8` 作为唯一图片渲染原生依赖（替换 `canvas`）。
- Rationale: `skia-canvas` 在安装阶段下载预编译二进制，避免 node-canvas 在 CI 依赖系统库/编译链导致的不稳定；同时提供 HTML5 Canvas 2D API 以降低迁移成本。
- Alternatives considered:
    - 继续使用 `canvas` 并在 CI 安装 Cairo/Pango: 仍受 runner 镜像/系统库变化影响，且安装步骤更重。
    - `@napi-rs/canvas`: 文档在 Context7 覆盖更好且也为 Skia + Node-API，但与需求硬性指定的 `skia-canvas@3.0.8` 不一致。

### 2) Package manager + native builds in CI

- Decision: 保持 pnpm；显式允许 `skia-canvas` 执行其 install/postinstall 下载步骤（pnpm 安全策略下需白名单）。
- Rationale: pnpm 默认会阻止原生依赖的安装脚本，导致“下载预编译库”不执行。
- Alternatives considered:
    - 切换到 npm/yarn: 变更面更大且不直接对应需求。
    - 在 CI 中额外执行 `pnpm approve-builds`: 对流水线影响更大且依赖人工维护。

### 3) ECharts 图片输出策略

- Decision: 将 ECharts 服务器端渲染改为 SVG SSR（ECharts 官方推荐路径），然后再转为 PNG 输出（由 `skia-canvas` 加载 SVG 并绘制到 Canvas，或在必要时使用独立的 SVG->PNG 渲染器）。
- Rationale: 直接让 ECharts 使用 Canvas backend 依赖 node-canvas 的平台 API（createCanvas/loadImage 回调模型），与 `skia-canvas` Promise 式 `loadImage` 不完全匹配；SVG SSR 能最大化兼容并降低与 Canvas 实现的耦合。
- Alternatives considered:
    - 继续 Canvas SSR 并做 skia-canvas adapter: 需要实现/维护 ECharts 平台 API 适配，且涉及图片加载回调模型差异。
    - 使用 headless browser 截图: 依赖更重，CI 更慢。

### 4) PNG encoding options parity

- Decision: 迁移后不再依赖 node-canvas 的 PNG `compressionLevel/filters` 选项；如需控制体积/性能，改为在写文件前做可选的后处理（例如用 `sharp` 固定参数重新编码）。
- Rationale: `skia-canvas` 的 `toBuffer('png')` 不提供 1:1 的 PNG 编码旋钮；强行模拟会增加复杂度。
- Alternatives considered:
    - 保留 node-canvas 仅用于 PNG 编码: 违背“移除导致 CI 失败的旧依赖”的目标。

### 5) Deterministic image regression testing

- Decision: 引入图片回归样例集（>=3 场景），用 Vitest 运行；对包含时间戳/耗时的 footer 做“固定时间/可关闭”处理，使 CI 对比可复现。
- Rationale: 图片生成最容易出现“可用但缺字/缺图”的回归，必须用可重复样例验证；并且字体/时间会导致 CI 输出不稳定。
- Alternatives considered:
    - 仅做“能生成文件”的测试: 无法发现缺字/布局漂移。

## Context7 Notes (Docs Availability)

- Context7 未返回 `samizdatco/skia-canvas`（Node 版）对应的库条目；当前可用的最接近条目是 `@napi-rs/canvas`（`/brooooooklyn/canvas`）和 Deno 的 `skia_canvas`（`/djdeveloperr/skia_canvas`）。
- 因此，本计划中关于 `skia-canvas`（Node 版）安装/CI 特性的信息来自上游 README 与 v3.0.8 release assets；而 Canvas API 的“概念对齐/替代方案”可参考 Context7 中 `@napi-rs/canvas` 文档。

## References

- Context7: `/brooooooklyn/canvas` (@napi-rs/canvas) basic usage + export + font registration examples
- Context7: `/djdeveloperr/skia_canvas` (Deno) API extensions overview
- Upstream (non-Context7): `skia-canvas` install and pnpm notes, v3.0.8 release assets
