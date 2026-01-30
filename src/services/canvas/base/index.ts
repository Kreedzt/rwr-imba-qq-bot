/**
 * Canvas Base Module - Core abstractions and utilities for canvas operations
 *
 * This module provides:
 * - TextWidthCalculator: CJK-aware text width calculation
 * - FooterRenderer: Configurable footer rendering with timing
 * - FileWriter: Safe file operations with comprehensive error handling
 * - BaseCanvasRefactored: Abstract base class with dependency injection
 * - DependencyFactory: Factory for creating canvas dependencies
 *
 * All classes follow SOLID principles:
 * - Single Responsibility Principle: Each class has one reason to change
 * - Open/Closed Principle: Open for extension, closed for modification
 * - Liskov Substitution Principle: Interfaces can be substituted
 * - Interface Segregation Principle: Small, focused interfaces
 * - Dependency Inversion Principle: Depend on abstractions, not concretions
 */

// Core calculators and renderers
export {
    TextWidthCalculator,
    textWidthCalculator,
} from './textWidthCalculator';
export type { TextWidthOptions } from './textWidthCalculator';

export { FooterRenderer } from './footerRenderer';
export type { FooterConfig, FooterRenderContext } from './footerRenderer';

export { FileWriter } from './fileWriter';
export type { FileWriterConfig, WriteResult } from './fileWriter';

// Base canvas abstraction
export { BaseCanvasRefactored } from './baseCanvasRefactored';
export type {
    BaseCanvasConfig,
    BaseCanvasDependencies,
    BackgroundRenderContext,
} from './baseCanvasRefactored';

// Dependency factory
export { DependencyFactory } from './dependencyFactory';
export type {
    CanvasDependencies,
    CanvasDependenciesConfig,
} from './dependencyFactory';
