import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    DependencyFactory,
    CanvasDependenciesConfig,
} from '../dependencyFactory';
import { CanvasImgService } from '../../../canvasImg.service';

describe('DependencyFactory', () => {
    beforeEach(() => {
        DependencyFactory.reset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('create', () => {
        it('should create all dependencies correctly', () => {
            const config: CanvasDependenciesConfig = {
                outputFolder: 'test-out',
                footerConfig: {
                    color: '#fff',
                    font: '10pt Arial',
                },
            };

            const deps = DependencyFactory.create(config);

            expect(deps).toHaveProperty('canvasImgService');
            expect(deps).toHaveProperty('textWidthCalculator');
            expect(deps).toHaveProperty('footerRenderer');
            expect(deps).toHaveProperty('fileWriter');

            // Verify types
            expect(deps.canvasImgService).toBe(CanvasImgService.getInstance());
            expect(deps.fileWriter.getOutputFolder()).toBe('test-out');
        });

        it('should create footerRenderer with provided config', () => {
            const config: CanvasDependenciesConfig = {
                outputFolder: 'out',
                footerConfig: {
                    color: '#000',
                    font: '12pt Consolas',
                },
            };

            const deps = DependencyFactory.create(config);

            // Verify footerRenderer was created with config
            expect(deps.footerRenderer).toBeDefined();
        });

        it('should create fileWriter with correct output folder', () => {
            const config: CanvasDependenciesConfig = {
                outputFolder: 'custom-output',
            };

            const deps = DependencyFactory.create(config);

            expect(deps.fileWriter.getOutputFolder()).toBe('custom-output');
        });
    });

    describe('getSingleton', () => {
        it('should return the same instance on multiple calls', () => {
            const config: CanvasDependenciesConfig = {
                outputFolder: 'test',
            };

            const instance1 = DependencyFactory.getSingleton(config);
            const instance2 = DependencyFactory.getSingleton(config);

            expect(instance1).toBe(instance2);
        });

        it('should create instance on first call', () => {
            const config: CanvasDependenciesConfig = {
                outputFolder: 'singleton-test',
            };

            DependencyFactory.reset(); // Ensure clean state
            const instance = DependencyFactory.getSingleton(config);

            expect(instance).toBeDefined();
            expect(instance.fileWriter.getOutputFolder()).toBe(
                'singleton-test',
            );
        });
    });

    describe('reset', () => {
        it('should reset singleton instance', () => {
            const config: CanvasDependenciesConfig = {
                outputFolder: 'test',
            };

            // Create first instance
            const instance1 = DependencyFactory.getSingleton(config);

            // Reset
            DependencyFactory.reset();

            // Create second instance after reset
            const instance2 = DependencyFactory.getSingleton(config);

            expect(instance1).not.toBe(instance2);
        });
    });
});
