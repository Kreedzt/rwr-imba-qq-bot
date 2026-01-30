import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    createCanvas,
    loadImageFrom,
    toPngBuffer,
    CanvasLike,
    Canvas2DContext,
} from './canvasBackend';

// Mock canvasFonts
vi.mock('./canvasFonts', () => ({
    initCanvasFonts: vi.fn(),
}));

describe('canvasBackend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createCanvas', () => {
        it('should create a canvas with specified dimensions', () => {
            const canvas = createCanvas(800, 600);

            expect(canvas).toBeDefined();
            expect(canvas.width).toBe(800);
            expect(canvas.height).toBe(600);
        });

        it('should create a canvas with 2D context', () => {
            const canvas = createCanvas(100, 100);
            const ctx = canvas.getContext('2d');

            expect(ctx).toBeDefined();
        });

        it('should be able to draw on canvas', () => {
            const canvas = createCanvas(10, 10);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(0, 0, 10, 10);

            expect(canvas).toBeDefined();
        });
    });

    describe('loadImageFrom', () => {
        it('should load image from file path', async () => {
            // Create a valid PNG file first
            const fs = require('fs');
            const path = require('path');
            const tempDir = path.join(process.cwd(), 'temp_test');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Create a minimal valid PNG (1x1 pixel, red)
            const pngBuffer = Buffer.from([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
                0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01,
                0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90,
                0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
                0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00,
                0x03, 0x00, 0x01, 0x00, 0x05, 0xfe, 0xd7, 0x20, 0x00, 0x00,
                0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
            ]);

            const tempFile = path.join(tempDir, 'test.png');
            fs.writeFileSync(tempFile, pngBuffer);

            try {
                const image = await loadImageFrom(tempFile);
                expect(image).toBeDefined();
                expect(image.width).toBeGreaterThan(0);
                expect(image.height).toBeGreaterThan(0);
            } finally {
                // Cleanup
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
                if (fs.existsSync(tempDir)) {
                    fs.rmdirSync(tempDir);
                }
            }
        });

        it('should handle invalid URL gracefully', async () => {
            // Test with an invalid URL - should throw
            await expect(
                loadImageFrom(
                    'https://invalid-domain-that-does-not-exist-12345.com/image.png',
                ),
            ).rejects.toThrow();
        });

        it('should load image from valid PNG Buffer', async () => {
            // Create a minimal valid PNG (1x1 pixel, red)
            const pngBuffer = Buffer.from([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
                0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01,
                0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90,
                0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
                0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00,
                0x03, 0x00, 0x01, 0x00, 0x05, 0xfe, 0xd7, 0x20, 0x00, 0x00,
                0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
            ]);

            const image = await loadImageFrom(pngBuffer);

            expect(image).toBeDefined();
            expect(image.width).toBe(1);
            expect(image.height).toBe(1);
        });

        it('should handle URL loading errors gracefully', async () => {
            // Testing with an invalid URL should throw an error
            await expect(
                loadImageFrom(
                    'https://invalid-domain-12345-xyz.com/nonexistent.png',
                ),
            ).rejects.toThrow();
        });

        it('should load image from valid PNG Buffer', async () => {
            // Create a minimal valid PNG (1x1 pixel, transparent)
            const pngBuffer = Buffer.from([
                0x89,
                0x50,
                0x4e,
                0x47,
                0x0d,
                0x0a,
                0x1a,
                0x0a, // PNG signature
                0x00,
                0x00,
                0x00,
                0x0d, // IHDR chunk length
                0x49,
                0x48,
                0x44,
                0x52, // IHDR
                0x00,
                0x00,
                0x00,
                0x01, // width: 1
                0x00,
                0x00,
                0x00,
                0x01, // height: 1
                0x08,
                0x06,
                0x00,
                0x00,
                0x00, // 8-bit RGBA, compression, filter, interlace
                0x1f,
                0x15,
                0xc4,
                0x89, // IHDR CRC
                0x00,
                0x00,
                0x00,
                0x0d, // IDAT chunk length
                0x49,
                0x44,
                0x41,
                0x54, // IDAT
                0x08,
                0x99,
                0x01,
                0x01,
                0x00,
                0x00,
                0x00,
                0xff,
                0xff, // compressed data
                0x00,
                0x00,
                0x00,
                0x02, // IDAT CRC
                0x00,
                0x00,
                0x00,
                0x00, // IEND chunk length
                0x49,
                0x45,
                0x4e,
                0x44, // IEND
                0xae,
                0x42,
                0x60,
                0x82, // IEND CRC
            ]);

            const image = await loadImageFrom(pngBuffer);

            expect(image).toBeDefined();
            expect(image.width).toBe(1);
            expect(image.height).toBe(1);
        });

        it('should throw error for invalid image path', async () => {
            // This test verifies error handling
            await expect(loadImageFrom('')).rejects.toThrow();
        });
    });

    describe('toPngBuffer', () => {
        it('should convert canvas to PNG buffer', () => {
            const canvas = createCanvas(10, 10);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(0, 0, 10, 10);

            const buf = toPngBuffer(canvas);

            expect(buf).toBeInstanceOf(Buffer);
            expect(buf.length).toBeGreaterThan(8);
        });

        it('should produce valid PNG signature', () => {
            const canvas = createCanvas(10, 10);
            const buf = toPngBuffer(canvas);

            // PNG signature: 89 50 4E 47 0D 0A 1A 0A
            expect(buf.subarray(0, 8)).toEqual(
                Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
            );
        });

        it('should throw error for invalid canvas', () => {
            expect(() => toPngBuffer(null as any)).toThrow();
        });

        it('should maintain image data integrity', () => {
            const canvas = createCanvas(100, 100);
            const ctx = canvas.getContext('2d');

            // Draw specific pattern
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 50, 50);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(50, 50, 50, 50);

            const buf = toPngBuffer(canvas);

            // Buffer should contain the rendered image data
            expect(buf.length).toBeGreaterThan(100);
        });
    });

    describe('Canvas operations', () => {
        it('should support multiple drawing operations', () => {
            const canvas = createCanvas(200, 200);
            const ctx = canvas.getContext('2d');

            // Fill rect
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 100, 100);

            // Stroke rect
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 5;
            ctx.strokeRect(50, 50, 100, 100);

            // Draw text
            ctx.font = '20px Arial';
            ctx.fillStyle = '#0000ff';
            ctx.fillText('Test', 80, 80);

            const buf = toPngBuffer(canvas);
            expect(buf.length).toBeGreaterThan(0);
        });

        it('should handle large canvas creation', () => {
            const canvas = createCanvas(2000, 2000);
            expect(canvas.width).toBe(2000);
            expect(canvas.height).toBe(2000);
        });

        it('should handle small canvas creation', () => {
            const canvas = createCanvas(1, 1);
            expect(canvas.width).toBe(1);
            expect(canvas.height).toBe(1);
        });
    });
});
