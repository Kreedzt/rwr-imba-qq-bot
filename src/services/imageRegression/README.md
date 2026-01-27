# Image Regression Suite

This suite validates that core image generation outputs remain usable and stable after renderer changes.

## Run

```bash
RUN_IMAGE_TESTS=1 pnpm test
```

## Update goldens

```bash
UPDATE_IMAGE_GOLDENS=1 RUN_IMAGE_TESTS=1 pnpm test
```

Goldens are stored in `src/services/imageRegression/goldens/`.

## Notes

- The suite stabilizes the footer timestamp via `CANVAS_FOOTER_FIXED_TIME`.
- On mismatch, artifacts are written to `out/image-regression/`.
