/**
 * TextWidthCalculator - Calculates text width considering Chinese characters
 *
 * Single Responsibility: Text width calculation with CJK character support
 */

export interface TextWidthOptions {
    baseWidth: number;
    cjkMultiplier?: number;
}

export class TextWidthCalculator {
    private readonly cnRegex: RegExp;
    private readonly defaultCjkMultiplier: number;

    constructor(cjkMultiplier = 2) {
        this.cnRegex = new RegExp('[\u4E00-\u9FA5]');
        this.defaultCjkMultiplier = cjkMultiplier;
    }

    /**
     * Calculate text width considering CJK characters
     */
    calculate(text: string, options: TextWidthOptions): number {
        const { baseWidth, cjkMultiplier = this.defaultCjkMultiplier } =
            options;

        let totalWidth = 0;

        for (const char of text) {
            if (this.cnRegex.test(char)) {
                totalWidth += baseWidth * cjkMultiplier;
            } else {
                totalWidth += baseWidth;
            }
        }

        return totalWidth;
    }

    /**
     * Calculate text width with default options
     */
    calculateSimple(text: string, baseWidth: number): number {
        return this.calculate(text, { baseWidth });
    }
}

// Singleton instance for convenience
export const textWidthCalculator = new TextWidthCalculator();
