/**
 * DependencyFactory - Creates and wires up canvas dependencies
 *
 * Follows Factory pattern for dependency injection
 */

import { CanvasImgService } from '../../canvasImg.service';
import { TextWidthCalculator } from './textWidthCalculator';
import { FooterRenderer, FooterConfig } from './footerRenderer';
import { FileWriter, FileWriterConfig } from './fileWriter';

export interface CanvasDependenciesConfig {
    outputFolder: string;
    footerConfig?: FooterConfig;
}

export interface CanvasDependencies {
    canvasImgService: CanvasImgService;
    textWidthCalculator: TextWidthCalculator;
    footerRenderer: FooterRenderer;
    fileWriter: FileWriter;
}

export class DependencyFactory {
    private static instance: CanvasDependencies | null = null;

    /**
     * Create all canvas dependencies
     */
    static create(config: CanvasDependenciesConfig): CanvasDependencies {
        // Services
        const canvasImgService = CanvasImgService.getInstance();
        const textWidthCalculator = new TextWidthCalculator();

        // Footer renderer with config
        const footerRenderer = new FooterRenderer(config.footerConfig);

        // File writer
        const fileWriterConfig: FileWriterConfig = {
            outputFolder: config.outputFolder,
            ensureDirectory: true,
        };
        const fileWriter = new FileWriter(fileWriterConfig);

        return {
            canvasImgService,
            textWidthCalculator,
            footerRenderer,
            fileWriter,
        };
    }

    /**
     * Get or create singleton dependencies
     */
    static getSingleton(config: CanvasDependenciesConfig): CanvasDependencies {
        if (!DependencyFactory.instance) {
            DependencyFactory.instance = DependencyFactory.create(config);
        }
        return DependencyFactory.instance;
    }

    /**
     * Reset singleton (useful for testing)
     */
    static reset(): void {
        DependencyFactory.instance = null;
    }
}
