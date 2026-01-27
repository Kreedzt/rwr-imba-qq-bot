import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { scenarios } from './scenarios';
import { diffRaw, pngBufferToRaw } from './pngDiff';

const RUN = process.env.RUN_IMAGE_TESTS === '1';
const UPDATE = process.env.UPDATE_IMAGE_GOLDENS === '1';

const goldensDir = path.join(
    process.cwd(),
    'src/services/imageRegression/goldens',
);
const artifactsDir = path.join(process.cwd(), 'out/image-regression');

const MAX_DIFF_RATIO = 0.0005; // 0.05% pixels

describe(RUN ? 'image regression' : 'image regression (skipped)', () => {
    const prevDisable = process.env.CANVAS_FOOTER_DISABLE;
    const prevFixed = process.env.CANVAS_FOOTER_FIXED_TIME;

    beforeAll(() => {
        if (!RUN) {
            return;
        }
        // Make footer stable for golden comparisons.
        process.env.CANVAS_FOOTER_DISABLE = '0';
        process.env.CANVAS_FOOTER_FIXED_TIME =
            process.env.CANVAS_FOOTER_FIXED_TIME ?? '2020-01-01T00:00:00.000Z';

        fs.mkdirSync(goldensDir, { recursive: true });
        fs.mkdirSync(artifactsDir, { recursive: true });
    });

    afterAll(() => {
        if (!RUN) {
            return;
        }
        process.env.CANVAS_FOOTER_DISABLE = prevDisable;
        process.env.CANVAS_FOOTER_FIXED_TIME = prevFixed;
    });

    it(
        RUN ? 'matches goldens' : 'matches goldens (skipped)',
        async () => {
            if (!RUN) {
                return;
            }

            for (const scenario of scenarios) {
                const goldenPath = path.join(goldensDir, `${scenario.id}.png`);

                const actualPath = await scenario.run();
                const actualBuf = fs.readFileSync(actualPath);

                if (UPDATE) {
                    fs.writeFileSync(goldenPath, actualBuf);
                    continue;
                }

                if (!fs.existsSync(goldenPath)) {
                    throw new Error(
                        `Missing golden for ${scenario.id}. Run: UPDATE_IMAGE_GOLDENS=1 RUN_IMAGE_TESTS=1 pnpm test`,
                    );
                }

                const expectedBuf = fs.readFileSync(goldenPath);

                const [expectedRaw, actualRaw] = await Promise.all([
                    pngBufferToRaw(expectedBuf),
                    pngBufferToRaw(actualBuf),
                ]);

                const diff = diffRaw(expectedRaw, actualRaw, MAX_DIFF_RATIO);
                if (!diff.pass) {
                    const base = `${scenario.id}-${Date.now()}`;
                    const expectedOut = path.join(
                        artifactsDir,
                        `${base}.expected.png`,
                    );
                    const actualOut = path.join(
                        artifactsDir,
                        `${base}.actual.png`,
                    );
                    const diffOut = path.join(artifactsDir, `${base}.diff.png`);

                    fs.writeFileSync(expectedOut, expectedBuf);
                    fs.writeFileSync(actualOut, actualBuf);

                    if (diff.diffMaskRaw) {
                        const { writeDiffPng } = await import('./pngDiff');
                        writeDiffPng(
                            diffOut,
                            expectedRaw.width,
                            expectedRaw.height,
                            diff.diffMaskRaw,
                        );
                    }

                    throw new Error(
                        `Image mismatch for ${scenario.id} (${scenario.name}): diffPixelRatio=${diff.diffPixelRatio} diffPixelCount=${diff.diffPixelCount}. Artifacts: ${expectedOut} ${actualOut} ${diffOut}`,
                    );
                }
            }

            expect(true).toBe(true);
        },
        30_000,
    );
});
