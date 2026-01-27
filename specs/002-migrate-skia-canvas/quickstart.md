# Phase 1 Quickstart: skia-canvas Migration Workbench

## Prereqs

- Node.js: 22.11.0
- Package manager: pnpm (as used by CI)

## Install

```bash
pnpm install
```

Notes:

- If pnpm blocks native dependency install scripts, ensure `skia-canvas` is allow-listed via `pnpm.onlyBuiltDependencies`.

## Run

```bash
pnpm test
pnpm run coverage
```

## Image regression suite

- Run locally (and in CI):

```bash
pnpm run test:image
```

- Updating goldens:

```bash
UPDATE_IMAGE_GOLDENS=1 pnpm run test:image
```

- On mismatch, artifacts are written to `out/image-regression/`.

## CI notes

- After migration, CI should no longer need to `apt-get install` Cairo/Pango dependencies for node-canvas.
- Keep Node version pinned to 22.11.0 to match current workflow.
