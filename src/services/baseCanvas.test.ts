import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseCanvas } from './baseCanvas';
import { CanvasRenderingContext2D, Canvas } from 'canvas';
import * as fs from 'fs';

// Mock canvas and fs
vi.mock('canvas', async (importOriginal) => {
  const actual = await importOriginal<typeof import('canvas')>();
  return {
    ...actual,
    createCanvas: vi.fn().mockImplementation((width: number, height: number) => ({
      getContext: vi.fn().mockReturnValue({
        fillStyle: '',
        fillRect: vi.fn(),
        fillText: vi.fn(), // 确保 fillText 是 spy
        measureText: vi.fn(),
        // drawImage: vi.fn(), // 确保 drawImage 是 spy
      }),
      toBuffer: vi.fn().mockReturnValue(Buffer.from('test')),
    })),
  };
});

vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
}));

vi.mock('path', () => ({
  join: vi.fn().mockImplementation((...args) => args.join('/')),
}));

describe('BaseCanvas', () => {
  let baseCanvas: BaseCanvas;
  let mockCtx: CanvasRenderingContext2D;
  let mockCanvas: Canvas;

  beforeEach(async () => {
    baseCanvas = new BaseCanvas();
    const mockedCanvas = await vi.importMock<typeof import('canvas')>('canvas');
    mockCanvas = vi.mocked(mockedCanvas.createCanvas(100, 100));
    mockCtx = mockCanvas.getContext('2d') as CanvasRenderingContext2D;

    // vi.spyOn(mockCtx, 'fillText');
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
      const result = baseCanvas.writeFile(mockCanvas, 'test.png');
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(result).toContain('test.png');
    });
  });
});