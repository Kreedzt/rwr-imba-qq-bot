import * as fs from 'node:fs';
import * as path from 'node:path';
import { Canvas, ImageData } from 'skia-canvas';
import { createCanvas, loadImageFrom } from '../canvasBackend';

export type PngRaw = {
    width: number;
    height: number;
    raw: Buffer; // RGBA bytes
};

export async function pngBufferToRaw(buf: Buffer): Promise<PngRaw> {
    const img = await loadImageFrom(buf);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img as any, 0, 0);
    const raw = canvas.toBufferSync('raw');
    return { width: img.width, height: img.height, raw };
}

export type PngDiff = {
    pass: boolean;
    diffPixelCount: number;
    diffPixelRatio: number;
    expected: { width: number; height: number };
    actual: { width: number; height: number };
    diffMaskRaw?: Buffer;
};

export function diffRaw(
    expected: PngRaw,
    actual: PngRaw,
    maxDiffPixelRatio: number,
): PngDiff {
    if (expected.width !== actual.width || expected.height !== actual.height) {
        return {
            pass: false,
            diffPixelCount: expected.width * expected.height,
            diffPixelRatio: 1,
            expected: { width: expected.width, height: expected.height },
            actual: { width: actual.width, height: actual.height },
        };
    }

    const pixels = expected.width * expected.height;
    let diffPixels = 0;
    const mask = Buffer.alloc(expected.raw.length);

    for (let i = 0; i < expected.raw.length; i += 4) {
        const r1 = expected.raw[i];
        const g1 = expected.raw[i + 1];
        const b1 = expected.raw[i + 2];
        const a1 = expected.raw[i + 3];

        const r2 = actual.raw[i];
        const g2 = actual.raw[i + 1];
        const b2 = actual.raw[i + 2];
        const a2 = actual.raw[i + 3];

        const same = r1 === r2 && g1 === g2 && b1 === b2 && a1 === a2;
        if (!same) {
            diffPixels++;
            // Red pixel in the diff mask.
            mask[i] = 255;
            mask[i + 1] = 0;
            mask[i + 2] = 0;
            mask[i + 3] = 255;
        }
    }

    const ratio = pixels === 0 ? 0 : diffPixels / pixels;
    return {
        pass: ratio <= maxDiffPixelRatio,
        diffPixelCount: diffPixels,
        diffPixelRatio: ratio,
        expected: { width: expected.width, height: expected.height },
        actual: { width: actual.width, height: actual.height },
        diffMaskRaw: mask,
    };
}

export function writeDiffPng(
    outPath: string,
    width: number,
    height: number,
    diffMaskRaw: Buffer,
) {
    const canvas = new Canvas(width, height);
    const ctx = canvas.getContext('2d');
    const img = new ImageData(
        new Uint8ClampedArray(diffMaskRaw),
        width,
        height,
    );
    ctx.putImageData(img, 0, 0);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, canvas.toBufferSync('png'));
}
