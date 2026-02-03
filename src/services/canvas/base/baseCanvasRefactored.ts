/**
 * BaseCanvasRefactored - Clean, modular canvas base class
 *
 * Refactored to follow SOLID principles:
 * - SRP: Each method has a single responsibility
 * - DIP: Depends on abstractions, not concretions
 * - OCP: Open for extension, closed for modification
 */

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { GlobalEnv } from '../../../types';
import type { Canvas2DContext, CanvasLike } from '../../canvasBackend';
import { toPngBuffer } from '../../canvasBackend';
import type { CanvasImgService } from '../../canvasImg.service';
import type {
    FooterConfig,
    FooterRenderer,
    FooterRenderContext,
} from './footerRenderer';
import type { FileWriter, FileWriterConfig, WriteResult } from './fileWriter';
import type { TextWidthCalculator } from './textWidthCalculator';

/**
 * Configuration for BaseCanvas
 */
export interface BaseCanvasConfig {
    outputFolder: string;
    footerConfig?: FooterConfig;
    fileWriterConfig?: Partial<FileWriterConfig>;
    backgroundImagePath?: string;
}

/**
 * Dependencies for BaseCanvas (constructor injection)
 */
export interface BaseCanvasDependencies {
    canvasImgService: CanvasImgService;
    footerRenderer: FooterRenderer;
    fileWriter: FileWriter;
    textWidthCalculator: TextWidthCalculator;
}

/**
 * Context for background image rendering
 */
export interface BackgroundRenderContext {
    context: Canvas2DContext;
    width: number;
    height: number;
    backgroundImagePath?: string;
    overlayOpacity?: number;
}

/**
 * Refactored BaseCanvas with clean separation of concerns
 */
export abstract class BaseCanvasRefactored {
    // Timing
    protected startTime?: Dayjs;

    // State
    protected totalFooter = '';
    protected renderStartY = 0;

    // Dependencies (injected)
    protected readonly canvasImgService: CanvasImgService;
    protected readonly footerRenderer: FooterRenderer;
    protected readonly fileWriter: FileWriter;
    protected readonly textWidthCalculator: TextWidthCalculator;

    constructor(dependencies: BaseCanvasDependencies) {
        this.canvasImgService = dependencies.canvasImgService;
        this.footerRenderer = dependencies.footerRenderer;
        this.fileWriter = dependencies.fileWriter;
        this.textWidthCalculator = dependencies.textWidthCalculator;
    }

    /**
     * Record the start time for performance tracking
     */
    record(): void {
        this.startTime = dayjs();
    }

    /**
     * Calculate text width considering CJK characters
     */
    calcCanvasTextWidth(text: string, base: number): number {
        return this.textWidthCalculator.calculateSimple(text, base);
    }

    /**
     * Render background image with optional overlay
     */
    renderBgImg(ctx: BackgroundRenderContext): void {
        const {
            context,
            width,
            height,
            backgroundImagePath,
            overlayOpacity = 0.6,
        } = ctx;

        const bgPath =
            backgroundImagePath || this.getBackgroundImagePathFromEnv();

        if (!bgPath) {
            return;
        }

        const img = this.canvasImgService.getImg(bgPath);
        if (!img) {
            return;
        }

        // Calculate scaled dimensions
        const scale = this.calculateScale(img.width, img.height, width, height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;

        // Draw image and overlay
        context.drawImage(img, x, y, scaledWidth, scaledHeight);
        this.renderOverlay(context, width, height, overlayOpacity);
    }

    /**
     * Calculate scale to fit image within bounds while maintaining aspect ratio
     */
    private calculateScale(
        imgWidth: number,
        imgHeight: number,
        targetWidth: number,
        targetHeight: number,
    ): number {
        const widthRatio = targetWidth / imgWidth;
        const heightRatio = targetHeight / imgHeight;
        return Math.min(widthRatio, heightRatio);
    }

    /**
     * Render semi-transparent overlay
     */
    private renderOverlay(
        context: Canvas2DContext,
        width: number,
        height: number,
        opacity: number,
    ): void {
        context.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        context.fillRect(0, 0, width, height);
    }

    /**
     * Get background image path from environment
     */
    private getBackgroundImagePathFromEnv(): string | undefined {
        // This is a workaround for the GlobalEnv type issue
        return (process.env as any).OUTPUT_BG_IMG;
    }

    /**
     * Render footer on the canvas
     */
    renderFooter(context: Canvas2DContext): string {
        const footerContext: FooterRenderContext = {
            context,
            startY: this.renderStartY,
            startTime: this.startTime,
        };

        const footerText = this.footerRenderer.render(footerContext);
        this.totalFooter = footerText;

        return footerText;
    }

    /**
     * Write canvas to file with comprehensive error handling
     */
    writeFile(canvas: CanvasLike, fileName: string): string {
        const result = this.fileWriter.write(canvas, fileName, toPngBuffer);
        return result.filePath;
    }

    /**
     * Get the total footer text (for testing or external access)
     */
    getTotalFooter(): string {
        return this.totalFooter;
    }

    /**
     * Set the Y position for rendering (for footer positioning)
     */
    setRenderStartY(y: number): void {
        this.renderStartY = y;
    }
}
