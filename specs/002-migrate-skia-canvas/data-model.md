# Phase 1 Data Model: Image Regression + Renderer Abstractions

> 本需求主要是“依赖迁移 + 回归验证”。这里的数据模型聚焦于可重复执行的图片回归样例集与渲染适配层的核心对象。

## Entities

### ImageScenario

Represents one reproducible image generation case.

- Fields
    - `id: string` (stable, filesystem-safe)
    - `name: string` (human-readable)
    - `kind: 'tdoll' | 'servers-map' | 'servers-players' | 'whereis' | 'echarts' | 'other'`
    - `inputs: object` (scenario-specific; must be serializable)
    - `expectedOutput: { mime: 'image/png'; width?: number; height?: number }`
    - `notes?: string`

- Validation rules
    - `id` MUST be unique across all scenarios
    - `inputs` MUST NOT require network access (fixtures only)
    - MUST be runnable in CI without manual pre-install steps

### ImageGolden

Stores the reference output for a scenario.

- Fields
    - `scenarioId: string`
    - `rendererId: string` (e.g. `skia-canvas@3.0.8`)
    - `pngPath: string` (repo-relative path under a snapshots folder)
    - `meta: { createdAt: string; nodeVersion: string; platform: string }`

- Validation rules
    - Goldens MUST be generated in a pinned environment to minimize drift

### ImageDiffResult

Outcome of comparing actual output to golden.

- Fields
    - `scenarioId: string`
    - `pass: boolean`
    - `diffPixelCount?: number`
    - `diffPixelRatio?: number`
    - `artifactPaths?: { actualPng: string; diffPng: string }`
    - `error?: { code: string; message: string; context?: object }`

### Renderer

Abstracts the underlying canvas implementation.

- Fields
    - `id: string` (e.g. `skia-canvas@3.0.8`)
    - `supports: { loadImage: boolean; svgInput: boolean; pngOptions: 'basic' | 'advanced' }`

- Operations
    - `createCanvas(width: number, height: number): Canvas`
    - `loadImage(src: string | Buffer): Promise<Image>`
    - `toPngBuffer(canvas: Canvas): Promise<Buffer>`

## Relationships

- `ImageScenario (1) -> (0..1) ImageGolden` per `rendererId`
- `ImageScenario (1) -> (1..n) ImageDiffResult` per test run

## State Transitions

- Scenario lifecycle
    - `draft` -> `validated` -> `golden-captured` -> `stable`
    - Any code change that impacts rendering may move `stable -> needs-review` (when diffs appear)
