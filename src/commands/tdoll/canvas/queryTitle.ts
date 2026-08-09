import { Canvas2DContext } from '../../../services/canvasBackend';
import { buildCanvasFont, CANVAS_FONT } from '../../../services/canvasFonts';
import { TextSegment, truncate } from '../../../services/canvasHelpers';
import { CANVAS_COLORS } from '../../../services/canvasTheme';
import { QUERY_HIGHLIGHT_COLOR } from './cardRenderer';

/**
 * 构建「查询 <query> 匹配结果」页面标题分段(query 命中高亮)。
 * 内部固定标题字体后再测量/截断, 不依赖调用方的 ctx.font 状态
 * (列表画布在调用前可能刚量过右侧统计字体)。
 * @param titleAreaWidth 标题区可用宽(已扣除 PAD 与右侧统计占宽)
 */
export const buildQueryTitleSegments = (
    ctx: Canvas2DContext,
    query: string,
    titleAreaWidth: number,
): TextSegment[] => {
    const titleFont = buildCanvasFont(
        CANVAS_FONT.size['2xl'],
        CANVAS_FONT.weight.bold,
        'sans',
    );
    ctx.font = titleFont;
    const staticWidth = ctx.measureText('查询  匹配结果').width;
    const queryText = truncate(
        ctx,
        query,
        Math.max(40, titleAreaWidth - staticWidth),
    );
    return [
        { text: '查询 ', color: CANVAS_COLORS.TEXT, font: titleFont },
        { text: queryText, color: QUERY_HIGHLIGHT_COLOR, font: titleFont },
        { text: ' 匹配结果', color: CANVAS_COLORS.TEXT, font: titleFont },
    ];
};
