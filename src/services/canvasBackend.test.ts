import { describe, it, expect } from 'vitest';
import { createCanvas, toPngBuffer } from './canvasBackend';

describe('canvasBackend', () => {
    it('creates a canvas and encodes PNG', () => {
        const canvas = createCanvas(10, 10);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, 10, 10);

        const buf = toPngBuffer(canvas);
        expect(buf.length).toBeGreaterThan(8);
        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        expect(buf.subarray(0, 8)).toEqual(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        );
    });
});
