import { describe, it, expect, beforeEach } from 'vitest';
import { TextWidthCalculator } from '../textWidthCalculator';

describe('TextWidthCalculator', () => {
    let calculator: TextWidthCalculator;

    beforeEach(() => {
        calculator = new TextWidthCalculator();
    });

    describe('calculate', () => {
        it('should calculate width for ASCII characters', () => {
            const result = calculator.calculate('Hello', { baseWidth: 10 });
            expect(result).toBe(50); // 5 chars * 10 baseWidth
        });

        it('should calculate width for Chinese characters with default multiplier', () => {
            const result = calculator.calculate('你好', { baseWidth: 10 });
            expect(result).toBe(40); // 2 chars * 10 * 2 (default CJK multiplier)
        });

        it('should calculate width for Chinese characters with custom multiplier', () => {
            const result = calculator.calculate('你好', {
                baseWidth: 10,
                cjkMultiplier: 3,
            });
            expect(result).toBe(60); // 2 chars * 10 * 3
        });

        it('should calculate width for mixed content', () => {
            const result = calculator.calculate('Hello你好', { baseWidth: 10 });
            expect(result).toBe(90); // (5 * 10) + (2 * 10 * 2) = 50 + 40
        });

        it('should handle empty string', () => {
            const result = calculator.calculate('', { baseWidth: 10 });
            expect(result).toBe(0);
        });
    });

    describe('calculateSimple', () => {
        it('should calculate width with default CJK multiplier', () => {
            const calculatorWithDefault = new TextWidthCalculator(2);
            const result = calculatorWithDefault.calculateSimple('你好', 10);
            expect(result).toBe(40);
        });
    });

    describe('custom CJK multiplier in constructor', () => {
        it('should use custom multiplier from constructor', () => {
            const customCalculator = new TextWidthCalculator(1.5);
            const result = customCalculator.calculate('你好', {
                baseWidth: 10,
            });
            expect(result).toBe(30); // 2 * 10 * 1.5
        });
    });
});
