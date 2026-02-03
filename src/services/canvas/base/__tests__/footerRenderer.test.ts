import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import dayjs from 'dayjs';
import { FooterRenderer, FooterConfig } from '../footerRenderer';
import type { Canvas2DContext } from '../../../canvasBackend';

describe('FooterRenderer', () => {
    let renderer: FooterRenderer;
    let mockContext: Canvas2DContext;
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset environment
        process.env = { ...originalEnv };
        delete process.env.CANVAS_FOOTER_DISABLE;
        delete process.env.CANVAS_FOOTER_FIXED_TIME;

        mockContext = {
            fillStyle: '',
            font: '',
            textAlign: '',
            fillText: vi.fn(),
        } as unknown as Canvas2DContext;

        renderer = new FooterRenderer();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('isDisabled', () => {
        it('should return false by default', () => {
            expect(renderer.isDisabled()).toBe(false);
        });

        it('should return true when config.disabled is true', () => {
            renderer = new FooterRenderer({ disabled: true });
            expect(renderer.isDisabled()).toBe(true);
        });

        it('should return true when CANVAS_FOOTER_DISABLE env is set', () => {
            process.env.CANVAS_FOOTER_DISABLE = '1';
            expect(renderer.isDisabled()).toBe(true);
        });
    });

    describe('render', () => {
        it('should return empty string when disabled', () => {
            renderer = new FooterRenderer({ disabled: true });
            const result = renderer.render({
                context: mockContext,
                startY: 100,
            });
            expect(result).toBe('');
            expect(mockContext.fillText).not.toHaveBeenCalled();
        });

        it('should set correct font styles', () => {
            renderer.render({
                context: mockContext,
                startY: 100,
            });

            expect(mockContext.fillStyle).toBe('#fff');
            expect(mockContext.font).toBe('bold 10pt Consolas');
            expect(mockContext.textAlign).toBe('left');
        });

        it('should use custom config when provided', () => {
            renderer = new FooterRenderer({
                color: '#000',
                font: '12pt Arial',
            });

            renderer.render({
                context: mockContext,
                startY: 100,
            });

            expect(mockContext.fillStyle).toBe('#000');
            expect(mockContext.font).toBe('12pt Arial');
        });

        it('should render footer with correct position', () => {
            const startY = 200;

            renderer.render({
                context: mockContext,
                startY,
            });

            expect(mockContext.fillText).toHaveBeenCalledWith(
                expect.stringContaining('RWR QQ Bot'),
                10,
                startY + 20,
            );
        });

        it('should use fixed time when provided', () => {
            const fixedTime = '2024-01-15 12:00:00';
            process.env.CANVAS_FOOTER_FIXED_TIME = fixedTime;

            renderer = new FooterRenderer();
            const result = renderer.render({
                context: mockContext,
                startY: 100,
            });

            expect(result).toContain('cost=0ms');
            expect(result).toContain('2024-01-15 12:00:00');
        });

        it('should use current time when no fixed time provided', () => {
            const before = new Date();

            const result = renderer.render({
                context: mockContext,
                startY: 100,
                startTime: undefined,
            });

            expect(result).toContain('RWR QQ Bot');
            // Result should contain current year
            const currentYear = new Date().getFullYear();
            expect(result).toContain(currentYear.toString());
        });

        it('should calculate cost from start time when provided', () => {
            const startTime = dayjs().subtract(100, 'millisecond');

            renderer.render({
                context: mockContext,
                startY: 100,
                startTime,
            });

            // The rendered text should contain a cost value
            const renderedText = (mockContext.fillText as any).mock.calls[0][0];
            expect(renderedText).toMatch(/cost=\d+ms/);
        });
    });

    describe('setConfig', () => {
        it('should update config', () => {
            renderer.setConfig({ color: '#ff0000' });

            renderer.render({
                context: mockContext,
                startY: 100,
            });

            expect(mockContext.fillStyle).toBe('#ff0000');
        });
    });
});
