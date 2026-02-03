import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { FileWriter, FileWriterConfig } from '../fileWriter';
import type { CanvasLike } from '../../../canvasBackend';
import type { ImageRenderError } from '../../../imageRenderErrors';

// Mock fs module
vi.mock('fs', async () => {
    const actual = await vi.importActual<typeof import('fs')>('fs');
    return {
        ...actual,
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        statSync: vi.fn(),
    };
});

describe('FileWriter', () => {
    let fileWriter: FileWriter;
    const mockConfig: FileWriterConfig = {
        outputFolder: 'test-out',
        ensureDirectory: true,
    };
    const mockCanvas = {} as CanvasLike;
    const mockBuffer = Buffer.from('test-png-data');

    beforeEach(() => {
        fileWriter = new FileWriter(mockConfig);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should merge default config with provided config', () => {
            const writer = new FileWriter({ outputFolder: 'out' });
            expect(writer.getOutputFolder()).toBe('out');
        });

        it('should default ensureDirectory to true', () => {
            const writer = new FileWriter({ outputFolder: 'out' });
            // Verify that ensureDirectory is true by default
            expect((writer as any).config.ensureDirectory).toBe(true);
        });
    });

    describe('write', () => {
        it('should create output directory if it does not exist', () => {
            (fs.existsSync as any).mockReturnValue(false);
            (fs.mkdirSync as any).mockReturnValue(undefined);
            (fs.writeFileSync as any).mockReturnValue(undefined);
            (fs.statSync as any).mockReturnValue({ size: 1000 });

            const toPngBufferFn = vi.fn().mockReturnValue(mockBuffer);
            const result = fileWriter.write(
                mockCanvas,
                'test.png',
                toPngBufferFn,
            );

            expect(fs.mkdirSync).toHaveBeenCalledWith('test-out', {
                recursive: true,
            });
            expect(result.fileName).toBe('test.png');
        });

        it('should not create directory if ensureDirectory is false', () => {
            const writer = new FileWriter({
                outputFolder: 'test-out',
                ensureDirectory: false,
            });

            (fs.writeFileSync as any).mockReturnValue(undefined);
            (fs.statSync as any).mockReturnValue({ size: 1000 });

            const toPngBufferFn = vi.fn().mockReturnValue(mockBuffer);
            writer.write(mockCanvas, 'test.png', toPngBufferFn);

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        it('should encode canvas to PNG buffer', () => {
            (fs.existsSync as any).mockReturnValue(true);
            (fs.writeFileSync as any).mockReturnValue(undefined);
            (fs.statSync as any).mockReturnValue({ size: 1000 });

            const toPngBufferFn = vi.fn().mockReturnValue(mockBuffer);
            fileWriter.write(mockCanvas, 'test.png', toPngBufferFn);

            expect(toPngBufferFn).toHaveBeenCalledWith(mockCanvas);
        });

        it('should throw ImageRenderError when encoding fails', () => {
            const toPngBufferFn = vi.fn().mockImplementation(() => {
                throw new Error('Encoding failed');
            });

            expect(() => {
                fileWriter.write(mockCanvas, 'test.png', toPngBufferFn);
            }).toThrow();

            try {
                fileWriter.write(mockCanvas, 'test.png', toPngBufferFn);
            } catch (err) {
                const imgError = err as ImageRenderError;
                expect(imgError.code).toBe('IMAGE_ENCODE_FAILED');
                expect(imgError.message).toBe('Failed to encode canvas to PNG');
                expect(imgError.context.scene).toBe('fileWriter:encode');
            }
        });

        it('should write buffer to correct path', () => {
            (fs.existsSync as any).mockReturnValue(true);
            (fs.writeFileSync as any).mockReturnValue(undefined);
            (fs.statSync as any).mockReturnValue({ size: 1024 });

            const toPngBufferFn = vi.fn().mockReturnValue(mockBuffer);
            const result = fileWriter.write(
                mockCanvas,
                'output.png',
                toPngBufferFn,
            );

            const expectedPath = path.join(
                process.cwd(),
                'test-out',
                'output.png',
            );
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expectedPath,
                mockBuffer,
            );
            expect(result.filePath).toBe(expectedPath);
        });

        it('should return file info with size', () => {
            (fs.existsSync as any).mockReturnValue(true);
            (fs.writeFileSync as any).mockReturnValue(undefined);
            (fs.statSync as any).mockReturnValue({ size: 2048 });

            const toPngBufferFn = vi.fn().mockReturnValue(mockBuffer);
            const result = fileWriter.write(
                mockCanvas,
                'test.png',
                toPngBufferFn,
            );

            expect(result.fileName).toBe('test.png');
            expect(result.size).toBe(2048);
        });

        it('should throw ImageRenderError when writing fails', () => {
            (fs.existsSync as any).mockReturnValue(true);
            (fs.writeFileSync as any).mockImplementation(() => {
                throw new Error('Disk full');
            });

            const toPngBufferFn = vi.fn().mockReturnValue(mockBuffer);

            try {
                fileWriter.write(mockCanvas, 'test.png', toPngBufferFn);
                expect.fail('Should have thrown');
            } catch (err) {
                const imgError = err as ImageRenderError;
                expect(imgError.code).toBe('IMAGE_WRITE_FAILED');
                expect(imgError.message).toBe('Failed to write PNG output');
                expect(imgError.context.scene).toBe('fileWriter:write');
            }
        });
    });

    describe('getOutputFolder', () => {
        it('should return output folder path', () => {
            const writer = new FileWriter({ outputFolder: 'custom-out' });
            expect(writer.getOutputFolder()).toBe('custom-out');
        });
    });

    describe('setConfig', () => {
        it('should update configuration', () => {
            const writer = new FileWriter({ outputFolder: 'old-out' });
            writer.setConfig({ outputFolder: 'new-out' });

            expect(writer.getOutputFolder()).toBe('new-out');
        });
    });
});
