import { describe, it, expect } from 'vitest';

// Test that all exports are available
import {
    // Core calculators and renderers
    TextWidthCalculator,
    textWidthCalculator,
    FooterRenderer,
    FileWriter,
    BaseCanvasRefactored,
    DependencyFactory,
} from '../index';

describe('canvas/base index exports', () => {
    it('should export TextWidthCalculator', () => {
        expect(TextWidthCalculator).toBeDefined();
        expect(typeof TextWidthCalculator).toBe('function');
    });

    it('should export textWidthCalculator singleton', () => {
        expect(textWidthCalculator).toBeDefined();
        expect(textWidthCalculator).toBeInstanceOf(TextWidthCalculator);
    });

    it('should export FooterRenderer', () => {
        expect(FooterRenderer).toBeDefined();
        expect(typeof FooterRenderer).toBe('function');
    });

    it('should export FileWriter', () => {
        expect(FileWriter).toBeDefined();
        expect(typeof FileWriter).toBe('function');
    });

    it('should export BaseCanvasRefactored', () => {
        expect(BaseCanvasRefactored).toBeDefined();
        expect(typeof BaseCanvasRefactored).toBe('function');
    });

    it('should export DependencyFactory', () => {
        expect(DependencyFactory).toBeDefined();
        expect(typeof DependencyFactory).toBe('function');
        expect(typeof DependencyFactory.create).toBe('function');
        expect(typeof DependencyFactory.getSingleton).toBe('function');
        expect(typeof DependencyFactory.reset).toBe('function');
    });

    it('should work with real instances', () => {
        // Test that we can create real instances
        const textCalc = new TextWidthCalculator();
        expect(textCalc.calculate('test', { baseWidth: 10 })).toBe(40);

        const footerRenderer = new FooterRenderer({ color: '#fff' });
        expect(footerRenderer.isDisabled()).toBe(false);

        const fileWriter = new FileWriter({ outputFolder: 'test' });
        expect(fileWriter.getOutputFolder()).toBe('test');
    });
});
