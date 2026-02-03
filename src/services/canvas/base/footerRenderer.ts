/**
 * FooterRenderer - Handles canvas footer rendering
 *
 * Single Responsibility: Renders footer text with timing information
 */

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { Canvas2DContext } from '../../canvasBackend';

export interface FooterConfig {
    disabled?: boolean;
    fixedTime?: string;
    font?: string;
    color?: string;
}

export interface FooterRenderContext {
    context: Canvas2DContext;
    startY: number;
    startTime?: Dayjs;
}

export class FooterRenderer {
    private config: FooterConfig;

    constructor(config: FooterConfig = {}) {
        this.config = config;
    }

    /**
     * Check if footer rendering is disabled
     */
    isDisabled(): boolean {
        return (
            this.config.disabled === true ||
            process.env.CANVAS_FOOTER_DISABLE === '1'
        );
    }

    /**
     * Get the fixed time from config or environment
     */
    private getFixedTime(): Dayjs | null {
        const fixed =
            this.config.fixedTime || process.env.CANVAS_FOOTER_FIXED_TIME;
        if (!fixed) {
            return null;
        }
        const parsed = dayjs(fixed);
        return parsed.isValid() ? parsed : null;
    }

    /**
     * Calculate the cost in milliseconds
     */
    private calculateCost(
        startTime: Dayjs | undefined,
        fixedTime: Dayjs | null,
    ): number {
        if (fixedTime) {
            return 0;
        }
        return startTime ? dayjs().diff(startTime) : 0;
    }

    /**
     * Generate footer text with timing information
     */
    private generateFooterText(cost: number, endTime: Dayjs): string {
        return `RWR QQ Bot (cost=${cost}ms, render time=${endTime.format('YYYY-MM-DD HH:mm:ss.SSS')})`;
    }

    /**
     * Render the footer on the canvas
     */
    render(ctx: FooterRenderContext): string {
        if (this.isDisabled()) {
            return '';
        }

        const { context, startY, startTime } = ctx;

        // Set up styles
        context.fillStyle = this.config.color || '#fff';
        context.font = this.config.font || 'bold 10pt Consolas';
        context.textAlign = 'left';

        // Calculate timing
        const fixedTime = this.getFixedTime();
        const endTime = fixedTime ?? dayjs();
        const cost = this.calculateCost(startTime, fixedTime);

        // Generate and render footer text
        const footerText = this.generateFooterText(cost, endTime);
        context.fillText(footerText, 10, startY + 20);

        return footerText;
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<FooterConfig>): void {
        this.config = { ...this.config, ...config };
    }
}
