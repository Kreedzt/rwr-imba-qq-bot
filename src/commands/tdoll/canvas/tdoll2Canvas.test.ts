import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TDoll2Canvas } from './tdoll2Canvas';
import { ITDollDataItem } from '../types/types';
import { CANVAS_STYLE } from '../types/constants';

// Mock canvas backend to avoid loading native renderer.
vi.mock('../../../services/canvasBackend', () => ({
    // Avoid referencing imported constants here; vi.mock is hoisted.
    createCanvas: vi.fn().mockImplementation(() => ({
        getContext: vi.fn().mockReturnValue({
            fillStyle: '',
            fillRect: vi.fn(),
            fillText: vi.fn(),
            measureText: vi.fn().mockReturnValue({ width: 100 }),
            strokeStyle: '',
            rect: vi.fn(),
            stroke: vi.fn(),
            drawImage: vi.fn(),
        }),
        toBufferSync: vi.fn().mockReturnValue(Buffer.from('test')),
    })),
    loadImageFrom: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
    toPngBuffer: vi
        .fn()
        .mockImplementation((canvas: any) => canvas.toBufferSync('png')),
}));

describe('TDoll2Canvas', () => {
    let tdollCanvas: TDoll2Canvas;
    const mockTDolls = [
        {
            id: '1',
            nameIngame: 'Test Doll',
            avatar: 'test.jpg',
            mod: '0',
        },
    ] as ITDollDataItem[];

    beforeEach(() => {
        tdollCanvas = new TDoll2Canvas('test', mockTDolls, 'test.png');
    });

    it('should initialize correctly', () => {
        expect(tdollCanvas).toBeInstanceOf(TDoll2Canvas);
        expect(tdollCanvas.query).toBe('test');
        expect(tdollCanvas.tdolls).toEqual(mockTDolls);
        expect(tdollCanvas.fileName).toBe('test.png');
    });

    describe('loadAllImg', () => {
        it('should load images successfully', async () => {
            await expect(tdollCanvas.loadAllImg()).resolves.not.toThrow();
        });
    });

    describe('measureTitle', () => {
        it('should measure title width correctly', () => {
            tdollCanvas.measureTitle();
            expect(tdollCanvas.measureMaxWidth).toBeGreaterThan(0);
            expect(tdollCanvas.totalTitle).toContain('test');
        });
    });

    describe('measureList', () => {
        it('should measure list dimensions correctly', () => {
            tdollCanvas.measureList();
            expect(tdollCanvas.measureMaxWidth).toBeGreaterThan(0);
            expect(tdollCanvas.renderHeight).toBeGreaterThan(0);
            expect(tdollCanvas.contentLines).toBe(1);
        });
    });

    describe('render', () => {
        it('should render canvas without errors', async () => {
            await expect(tdollCanvas.render()).resolves.not.toThrow();
        });
    });
});
