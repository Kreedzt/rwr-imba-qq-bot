/**
 * FileWriter - Handles file system operations for canvas output
 *
 * Single Responsibility: Write canvas buffers to files with error handling
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CanvasLike, toPngBuffer } from '../../canvasBackend';
import { asImageRenderError } from '../../imageRenderErrors';
import { logImageRenderError } from '../../imageRenderLogger';

export interface FileWriterConfig {
    outputFolder: string;
    ensureDirectory?: boolean;
}

export interface WriteResult {
    filePath: string;
    fileName: string;
    size: number;
}

export class FileWriter {
    private config: FileWriterConfig;

    constructor(config: FileWriterConfig) {
        this.config = {
            ensureDirectory: true,
            ...config,
        };
    }

    /**
     * Ensure the output directory exists
     */
    private ensureDirectory(): void {
        if (!fs.existsSync(this.config.outputFolder)) {
            fs.mkdirSync(this.config.outputFolder, { recursive: true });
        }
    }

    /**
     * Get the full output path for a file
     */
    private getOutputPath(fileName: string): string {
        return path.join(process.cwd(), this.config.outputFolder, fileName);
    }

    /**
     * Convert canvas to PNG buffer with error handling
     */
    private encodeToPng(
        canvas: CanvasLike,
        fileName: string,
        toPngBufferFn: typeof toPngBuffer,
    ): Buffer {
        try {
            return toPngBufferFn(canvas);
        } catch (err) {
            const wrapped = asImageRenderError(err, {
                code: 'IMAGE_ENCODE_FAILED',
                message: 'Failed to encode canvas to PNG',
                context: { scene: 'fileWriter:encode', fileName },
            });
            logImageRenderError(wrapped);
            throw wrapped;
        }
    }

    /**
     * Write buffer to file with error handling
     */
    private writeBuffer(
        buffer: Buffer,
        fileName: string,
        outputPath: string,
    ): WriteResult {
        try {
            fs.writeFileSync(outputPath, buffer);

            const stats = fs.statSync(outputPath);

            return {
                filePath: outputPath,
                fileName,
                size: stats.size,
            };
        } catch (err) {
            const wrapped = asImageRenderError(err, {
                code: 'IMAGE_WRITE_FAILED',
                message: 'Failed to write PNG output',
                context: { scene: 'fileWriter:write', fileName },
            });
            logImageRenderError(wrapped);
            throw wrapped;
        }
    }

    /**
     * Write canvas to file
     */
    write(
        canvas: CanvasLike,
        fileName: string,
        toPngBufferFn: typeof toPngBuffer,
    ): WriteResult {
        if (this.config.ensureDirectory) {
            this.ensureDirectory();
        }

        const outputPath = this.getOutputPath(fileName);
        const buffer = this.encodeToPng(canvas, fileName, toPngBufferFn);

        return this.writeBuffer(buffer, fileName, outputPath);
    }

    /**
     * Get the output folder path
     */
    getOutputFolder(): string {
        return this.config.outputFolder;
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<FileWriterConfig>): void {
        this.config = { ...this.config, ...config };
    }
}
