import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseCanvas } from './baseCanvas';
import * as fs from 'fs';
import type { Canvas2DContext, CanvasLike } from './canvasBackend';

describe('BaseCanvas', () => {
    let baseCanvas: BaseCanvas;
    let mockCtx: Canvas2DContext;
    let mockCanvas: CanvasLike;

    beforeEach(async () => {
        baseCanvas = new BaseCanvas();

        mockCtx = {
            fillStyle: '',
            font: '',
            textAlign: 'left',
            fillRect: vi.fn(),
            fillText: vi.fn(),
            measureText: vi.fn().mockReturnValue({ width: 0 }),
        } as any;

        mockCanvas = {
            toBufferSync: vi.fn().mockReturnValue(Buffer.from('test')),
            getContext: vi.fn().mockReturnValue(mockCtx),
        } as any;
    });

    it('should initialize correctly', () => {
        expect(baseCanvas).toBeInstanceOf(BaseCanvas);
        expect(baseCanvas.startTime).toBeUndefined();
        expect(baseCanvas.totalFooter).toBe('');
        expect(baseCanvas.renderStartY).toBe(0);
    });

    describe('calcCanvasTextWidth', () => {
        it('should calculate width for English text', () => {
            const width = baseCanvas.calcCanvasTextWidth('test', 10);
            expect(width).toBe(40);
        });

        it('should calculate width for Chinese text', () => {
            const width = baseCanvas.calcCanvasTextWidth('测试', 10);
            expect(width).toBe(40);
        });

        it('should calculate width for mixed text', () => {
            const width = baseCanvas.calcCanvasTextWidth('test测试', 10);
            expect(width).toBe(80);
        });
    });

    describe('renderFooter', () => {
        it('should render footer text correctly', () => {
            baseCanvas.renderStartY = 100;
            baseCanvas.record();
            baseCanvas.renderFooter(mockCtx);
            // TODO
            // expect(mockCtx.fillText).toHaveBeenCalled();
            expect(baseCanvas.totalFooter).toContain('RWR QQ Bot');
        });
    });

    describe('record', () => {
        it('should record start time', () => {
            baseCanvas.record();
            expect(baseCanvas.startTime).toBeDefined();
        });
    });

    describe('writeFile', () => {
        it('should write file correctly', () => {
            const fileName = `baseCanvas-test-${Date.now()}.png`;
            const result = baseCanvas.writeFile(mockCanvas, fileName);
            expect(result).toContain(fileName);
            expect(fs.existsSync(result)).toBe(true);
            fs.unlinkSync(result);
        });
    });
});
