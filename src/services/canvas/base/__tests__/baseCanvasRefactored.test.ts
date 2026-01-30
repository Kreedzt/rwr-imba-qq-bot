import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
    BaseCanvasRefactored,
    BaseCanvasDependencies,
    BackgroundRenderContext,
} from '../baseCanvasRefactored';
import type { CanvasImgService } from '../../../canvasImg.service';
import type { FooterRenderer, FooterRenderContext } from '../footerRenderer';
import type { FileWriter, WriteResult } from '../fileWriter';
import type { TextWidthCalculator } from '../textWidthCalculator';
import type { Canvas2DContext, CanvasLike } from '../../../canvasBackend';
import { toPngBuffer } from '../../../canvasBackend';

// Type for mocked functions
type MockedFunction<T> = T & ReturnType<typeof vi.fn>;

// Mock dependencies
class TestableBaseCanvas extends BaseCanvasRefactored {
    // Expose protected members for testing
    public getStartTime(): Dayjs | undefined {
        return this.startTime;
    }

    public getTotalFooter(): string {
        return this.totalFooter;
    }

    public getRenderStartY(): number {
        return this.renderStartY;
    }

    public testRenderBgImg(ctx: BackgroundRenderContext): void {
        return this.renderBgImg(ctx);
    }

    public testCalculateScale(
        imgWidth: number,
        imgHeight: number,
        targetWidth: number,
        targetHeight: number,
    ): number {
        // Access private method through type assertion
        return (this as any).calculateScale(
            imgWidth,
            imgHeight,
            targetWidth,
            targetHeight,
        );
    }

    public testRenderOverlay(
        context: Canvas2DContext,
        width: number,
        height: number,
        opacity: number,
    ): void {
        return (this as any).renderOverlay(context, width, height, opacity);
    }
}

describe('BaseCanvasRefactored', () => {
    let canvas: TestableBaseCanvas;
    let mockDependencies: BaseCanvasDependencies;
    let mockCanvasImgService: CanvasImgService;
    let mockFooterRenderer: FooterRenderer;
    let mockFileWriter: FileWriter;
    let mockTextWidthCalculator: TextWidthCalculator;
    let mockContext: Canvas2DContext;

    beforeEach(() => {
        // Create mock services with vi.fn() for all methods
        mockCanvasImgService = {
            getImg: vi.fn(),
        } as unknown as CanvasImgService;

        mockFooterRenderer = {
            isDisabled: vi.fn().mockReturnValue(false),
            render: vi.fn().mockReturnValue('Test footer text'),
            setConfig: vi.fn(),
        } as unknown as FooterRenderer;

        mockFileWriter = {
            write: vi.fn().mockReturnValue({
                filePath: '/test/output.png',
                fileName: 'output.png',
                size: 1024,
            } as WriteResult),
            getOutputFolder: vi.fn().mockReturnValue('out'),
            setConfig: vi.fn(),
        } as unknown as FileWriter;

        mockTextWidthCalculator = {
            calculate: vi.fn().mockReturnValue(100),
            calculateSimple: vi.fn().mockReturnValue(100),
        } as unknown as TextWidthCalculator;

        mockContext = {
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn(),
        } as unknown as Canvas2DContext;

        mockDependencies = {
            canvasImgService: mockCanvasImgService,
            footerRenderer: mockFooterRenderer,
            fileWriter: mockFileWriter,
            textWidthCalculator: mockTextWidthCalculator,
        };

        canvas = new TestableBaseCanvas(mockDependencies);
    });

    describe('record', () => {
        it('should set startTime to current time', () => {
            expect(canvas.getStartTime()).toBeUndefined();

            canvas.record();

            expect(canvas.getStartTime()).toBeDefined();
            // Should be a recent time (within last second)
            const now = dayjs();
            const diff = now.diff(canvas.getStartTime(), 'second');
            expect(diff).toBeLessThan(1);
        });
    });

    describe('calcCanvasTextWidth', () => {
        it('should delegate to textWidthCalculator', () => {
            const text = 'Hello 你好';
            const base = 10;

            canvas.calcCanvasTextWidth(text, base);

            expect(
                mockTextWidthCalculator.calculateSimple as MockedFunction<
                    typeof mockTextWidthCalculator.calculateSimple
                >,
            ).toHaveBeenCalledWith(text, base);
        });

        it('should return the calculated width', () => {
            (
                mockTextWidthCalculator.calculateSimple as MockedFunction<
                    typeof mockTextWidthCalculator.calculateSimple
                >
            ).mockReturnValue(150);

            const result = canvas.calcCanvasTextWidth('test', 10);

            expect(result).toBe(150);
        });
    });

    describe('renderBgImg', () => {
        it('should do nothing if no background image path provided', () => {
            const ctx: BackgroundRenderContext = {
                context: mockContext,
                width: 800,
                height: 600,
            };

            canvas.testRenderBgImg(ctx);

            expect(
                mockCanvasImgService.getImg as MockedFunction<
                    typeof mockCanvasImgService.getImg
                >,
            ).not.toHaveBeenCalled();
            expect(
                mockContext.drawImage as MockedFunction<
                    typeof mockContext.drawImage
                >,
            ).not.toHaveBeenCalled();
        });

        it('should do nothing if image not found', () => {
            (
                mockCanvasImgService.getImg as MockedFunction<
                    typeof mockCanvasImgService.getImg
                >
            ).mockReturnValue(null as any);

            const ctx: BackgroundRenderContext = {
                context: mockContext,
                width: 800,
                height: 600,
                backgroundImagePath: '/path/to/bg.png',
            };

            canvas.testRenderBgImg(ctx);

            expect(
                mockCanvasImgService.getImg as MockedFunction<
                    typeof mockCanvasImgService.getImg
                >,
            ).toHaveBeenCalledWith('/path/to/bg.png');
            expect(
                mockContext.drawImage as MockedFunction<
                    typeof mockContext.drawImage
                >,
            ).not.toHaveBeenCalled();
        });

        it('should render background image scaled to fit', () => {
            const mockImage = {
                width: 1920,
                height: 1080,
            };
            (
                mockCanvasImgService.getImg as MockedFunction<
                    typeof mockCanvasImgService.getImg
                >
            ).mockReturnValue(mockImage as any);

            const ctx: BackgroundRenderContext = {
                context: mockContext,
                width: 800,
                height: 600,
                backgroundImagePath: '/path/to/bg.png',
            };

            canvas.testRenderBgImg(ctx);

            expect(
                mockContext.drawImage as MockedFunction<
                    typeof mockContext.drawImage
                >,
            ).toHaveBeenCalled();
            expect(
                mockContext.fillRect as MockedFunction<
                    typeof mockContext.fillRect
                >,
            ).toHaveBeenCalled();

            // Check that overlay is rendered with semi-transparent black
            expect(mockContext.fillStyle).toBe('rgba(0, 0, 0, 0.6)');
            expect(
                mockContext.fillRect as MockedFunction<
                    typeof mockContext.fillRect
                >,
            ).toHaveBeenCalledWith(0, 0, 800, 600);
        });

        it('should render with custom overlay opacity', () => {
            const mockImage = {
                width: 1920,
                height: 1080,
            };
            (
                mockCanvasImgService.getImg as MockedFunction<
                    typeof mockCanvasImgService.getImg
                >
            ).mockReturnValue(mockImage as any);

            const ctx: BackgroundRenderContext = {
                context: mockContext,
                width: 800,
                height: 600,
                backgroundImagePath: '/path/to/bg.png',
                overlayOpacity: 0.3,
            };

            canvas.testRenderBgImg(ctx);

            expect(mockContext.fillStyle).toBe('rgba(0, 0, 0, 0.3)');
        });
    });

    describe('renderFooter', () => {
        it('should delegate to footerRenderer', () => {
            const mockCtx = {} as Canvas2DContext;

            canvas.renderFooter(mockCtx);

            expect(
                mockFooterRenderer.render as MockedFunction<
                    typeof mockFooterRenderer.render
                >,
            ).toHaveBeenCalledWith({
                context: mockCtx,
                startY: 0, // default renderStartY
                startTime: undefined,
            });
        });

        it('should update renderStartY and return footer text', () => {
            canvas.setRenderStartY(500);
            (
                mockFooterRenderer.render as MockedFunction<
                    typeof mockFooterRenderer.render
                >
            ).mockReturnValue('Footer text here');

            const result = canvas.renderFooter({} as Canvas2DContext);

            expect(result).toBe('Footer text here');
            expect(canvas.getTotalFooter()).toBe('Footer text here');
        });

        it('should use recorded startTime when available', () => {
            canvas.record();
            const startTime = canvas.getStartTime();

            canvas.renderFooter({} as Canvas2DContext);

            expect(
                mockFooterRenderer.render as MockedFunction<
                    typeof mockFooterRenderer.render
                >,
            ).toHaveBeenCalledWith(expect.objectContaining({ startTime }));
        });
    });

    describe('writeFile', () => {
        it('should delegate to fileWriter', () => {
            const mockCanvas = {} as CanvasLike;

            const result = canvas.writeFile(mockCanvas, 'output.png');

            expect(
                mockFileWriter.write as MockedFunction<
                    typeof mockFileWriter.write
                >,
            ).toHaveBeenCalledWith(mockCanvas, 'output.png', toPngBuffer);
            expect(result).toBe('/test/output.png');
        });
    });

    describe('utility methods', () => {
        it('should get and set renderStartY', () => {
            expect(canvas.getRenderStartY()).toBe(0);

            canvas.setRenderStartY(750);

            expect(canvas.getRenderStartY()).toBe(750);
        });

        it('should get total footer', () => {
            (
                mockFooterRenderer.render as MockedFunction<
                    typeof mockFooterRenderer.render
                >
            ).mockReturnValue('Rendered footer');

            canvas.renderFooter({} as Canvas2DContext);

            expect(canvas.getTotalFooter()).toBe('Rendered footer');
        });
    });
});
