import { CN_REGEX } from '../../../../services/baseCanvas';

/**
 * 文本宽度计算器
 * 负责计算 Canvas 文本渲染宽度
 */
export class TextWidthCalculator {
    /**
     * 计算文本在 Canvas 上的渲染宽度
     * @param text - 要计算的文本
     * @param base - 基础字符宽度
     * @returns 计算后的总宽度
     */
    calcCanvasTextWidth(text: string, base: number): number {
        let countWidth = 0;
        for (let i = 0; i < text.length; ++i) {
            if (CN_REGEX.test(text[i])) {
                countWidth += base * 2;
            } else {
                countWidth += base;
            }
        }
        return countWidth;
    }

    /**
     * 批量计算多个文本的宽度，返回最大值
     * @param texts - 文本数组
     * @param base - 基础字符宽度
     * @returns 最大宽度
     */
    calcMaxWidth(texts: string[], base: number): number {
        return Math.max(...texts.map(text => this.calcCanvasTextWidth(text, base)));
    }
}
