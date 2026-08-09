import { Canvas2DContext } from './canvasBackend';
import { buildCanvasFont, CANVAS_FONT } from './canvasFonts';
import {
    CanvasShadow,
    CANVAS_COLORS,
    CANVAS_RADIUS,
    CANVAS_SHADOW,
    CANVAS_SPACE,
} from './canvasTheme';
import {
    drawSegments,
    measureSegmentsWidth,
    roundRectPath,
    truncate,
    withShadow,
    TextSegment,
} from './canvasHelpers';

/**
 * 共享布局原语 — 各 canvas 复用的页面级绘制单元。
 * 以「最常用场景」优先, 不追求过度抽象; 需要精细控制时仍可直接调用底层 ctx。
 */

// ============================================================================
// 宽度策略
// ============================================================================

/** 服务器类 canvas 的宽度 clamp 区间 */
export const CANVAS_MIN_WIDTH = 560;
export const CANVAS_MAX_WIDTH = 880;

/** 卡片内容最大可用宽(按 MAX_WIDTH 与标准 PAD/卡片内边距推算, measure 与 paint 共用) */
export const CANVAS_CARD_CONTENT_MAX_W =
    CANVAS_MAX_WIDTH - CANVAS_SPACE[6] * 2 - CANVAS_SPACE[4] * 2;

/** 把内容自然宽 clamp 到 [MIN_WIDTH, MAX_WIDTH] */
export function clampCanvasWidth(naturalW: number): number {
    return Math.min(
        Math.max(Math.ceil(naturalW), CANVAS_MIN_WIDTH),
        CANVAS_MAX_WIDTH,
    );
}

/**
 * 组装「截断后的名称 + 尾段」分段文本:
 * 先测尾段总宽, 名称截断预算 = maxContentW - 尾段宽(长名称以省略号截断, 防溢出)。
 * players/whereis/maps/map-detail 共用同一算法, 避免各自维护截断预算。
 */
export function buildTruncatedNameSegments(
    ctx: Canvas2DContext,
    name: string,
    tail: TextSegment[],
    maxContentW: number,
    nameFont: string,
    nameColor: string = CANVAS_COLORS.TEXT,
): TextSegment[] {
    const tailW = measureSegmentsWidth(ctx, tail);
    ctx.font = nameFont;
    const nameMaxW = Math.max(60, maxContentW - tailW);
    return [
        {
            text: `${truncate(ctx, name, nameMaxW)}: `,
            color: nameColor,
            font: nameFont,
        },
        ...tail,
    ];
}

// ============================================================================
// 页面标题 / 小节标题
// ============================================================================

const PAGE_TITLE_H = 56;
const SECTION_HEADER_H = 40;

export interface PageTitleOptions {
    /** 标题右侧统计分段的右对齐锚点 x(默认 width - PAD) */
    rightX?: number;
    /** 标题区高度(默认 56) */
    height?: number;
    /** 标题分段文本(支持命中高亮等), 传入则替代 title 纯文本绘制 */
    titleSegments?: TextSegment[];
}

/**
 * 页面大标题(2xl sans) + 右侧统计分段(右对齐)。
 * 调用后 textBaseline 恢复为 'top', textAlign 为 'left'。
 */
export function renderPageTitle(
    ctx: Canvas2DContext,
    x: number,
    y: number,
    title: string,
    rightSegments?: TextSegment[],
    options: PageTitleOptions = {},
): number {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    if (options.titleSegments && options.titleSegments.length > 0) {
        drawSegments(ctx, x, y, options.titleSegments);
    } else {
        ctx.fillStyle = CANVAS_COLORS.TEXT;
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size['2xl'],
            CANVAS_FONT.weight.bold,
            'sans',
        );
        ctx.fillText(title, x, y);
    }

    if (rightSegments && rightSegments.length > 0) {
        // 右侧统计与标题按 alphabetic baseline 对齐,
        // 避免小字号统计被视觉上感知为“飘在标题上方”。
        const titleFont = buildCanvasFont(
            CANVAS_FONT.size['2xl'],
            CANVAS_FONT.weight.bold,
            'sans',
        );
        ctx.font = titleFont;
        // measureText 受当前 textBaseline 影响, 先用 alphabetic 取准确度量
        ctx.textBaseline = 'alphabetic';
        const titleMetrics = ctx.measureText(title);
        const titleBaselineY = y + titleMetrics.emHeightAscent;
        ctx.textBaseline = 'alphabetic';
        drawSegments(
            ctx,
            options.rightX ?? x + CANVAS_MAX_WIDTH - CANVAS_SPACE[6],
            titleBaselineY,
            rightSegments,
            'right',
        );
        ctx.textBaseline = 'top';
    }
    ctx.textAlign = 'left';

    return y + (options.height ?? PAGE_TITLE_H);
}

export interface SectionHeaderOptions {
    x?: number;
    /** 右侧说明的右对齐锚点 x */
    rightX?: number;
    /** 小节标题区高度(默认 40) */
    height?: number;
}

/** 小节标题(xl sans + accent 竖条), 可选右侧说明文字; 竖条与文字均垂直居中 */
export function renderSectionHeader(
    ctx: Canvas2DContext,
    y: number,
    title: string,
    rightNote = '',
    options: SectionHeaderOptions = {},
): number {
    const x = options.x ?? CANVAS_SPACE[6];
    const height = options.height ?? SECTION_HEADER_H;
    const midY = y + height / 2;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.font = buildCanvasFont(
        CANVAS_FONT.size.xl,
        CANVAS_FONT.weight.bold,
        'sans',
    );
    const titleMetrics = ctx.measureText(title);
    const titleAscent = titleMetrics.actualBoundingBoxAscent;
    const titleDescent = titleMetrics.actualBoundingBoxDescent;
    const textTop = midY - titleAscent;
    const textBottom = midY + titleDescent;
    const barTop = Math.max(y, textTop);
    const barBottom = Math.min(y + height, textBottom);
    ctx.fillStyle = CANVAS_COLORS.AMBER_500;
    ctx.fillRect(x, barTop, 4, barBottom - barTop);

    ctx.fillStyle = CANVAS_COLORS.TEXT;
    ctx.fillText(title, x + 14, midY);

    if (rightNote) {
        ctx.textAlign = 'right';
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
        ctx.fillText(
            rightNote,
            options.rightX ?? x + CANVAS_MAX_WIDTH - CANVAS_SPACE[6],
            midY,
        );
        ctx.textAlign = 'left';
    }

    ctx.textBaseline = 'top';
    return y + height;
}

// ============================================================================
// 卡片
// ============================================================================

export interface CardOptions {
    radius?: number;
    fillStyle?: string;
    /** 传 null 关闭阴影 */
    shadow?: CanvasShadow | null;
}

/** 圆角卡片 + 默认 shadow-1(顶层卡片统一投影, 与背景形成层级) */
export function renderCard(
    ctx: Canvas2DContext,
    x: number,
    y: number,
    w: number,
    h: number,
    options: CardOptions = {},
): void {
    const radius = options.radius ?? CANVAS_RADIUS.lg;
    const shadow = options.shadow === undefined ? CANVAS_SHADOW[1] : options.shadow;
    const draw = () => {
        ctx.fillStyle = options.fillStyle ?? CANVAS_COLORS.BG_OVERLAY;
        roundRectPath(ctx, x, y, w, h, radius);
        ctx.fill();
    };
    if (shadow) {
        withShadow(ctx, shadow, draw);
    } else {
        draw();
    }
}

export interface KpiCardOptions {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    value: string;
    valueColor?: string;
    sub?: string;
}

/** KPI 卡片: label(sm muted) + value(2xl mono) + sub(sm muted) */
export function renderKpiCard(
    ctx: Canvas2DContext,
    opts: KpiCardOptions,
): void {
    const { x, y, w, h, label, value, valueColor = CANVAS_COLORS.TEXT, sub } =
        opts;

    renderCard(ctx, x, y, w, h);

    const innerX = x + CANVAS_SPACE[4];
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = buildCanvasFont(
        CANVAS_FONT.size.sm,
        CANVAS_FONT.weight.normal,
        'sans',
    );
    ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
    ctx.fillText(label, innerX, y + 14);

    ctx.font = buildCanvasFont(
        CANVAS_FONT.size['2xl'],
        CANVAS_FONT.weight.bold,
        'mono',
    );
    ctx.fillStyle = valueColor;
    ctx.fillText(truncate(ctx, value, w - CANVAS_SPACE[8]), innerX, y + 36);

    if (sub) {
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
        ctx.fillText(truncate(ctx, sub, w - CANVAS_SPACE[8]), innerX, y + 72);
    }

    ctx.textBaseline = 'top';
}

export interface ChipOptions {
    bg?: string;
    textColor?: string;
    font?: string;
    radius?: number;
    /** 边框颜色(如 moderator 高亮), 传 undefined 不描边 */
    borderColor?: string;
    borderWidth?: number;
}

/** 胶囊 chip(带左右内边距绘制文本), 可选描边; chip 不加阴影 */
export function renderChip(
    ctx: Canvas2DContext,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    options: ChipOptions = {},
): void {
    const radius = options.radius ?? h / 2;
    ctx.fillStyle = options.bg ?? CANVAS_COLORS.CHIP_BG;
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.fill();

    if (options.borderColor) {
        ctx.strokeStyle = options.borderColor;
        ctx.lineWidth = options.borderWidth ?? 1;
        roundRectPath(ctx, x, y, w, h, radius);
        ctx.stroke();
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font =
        options.font ??
        buildCanvasFont(CANVAS_FONT.size.base, CANVAS_FONT.weight.bold, 'mono');
    ctx.fillStyle = options.textColor ?? CANVAS_COLORS.TEXT;
    ctx.fillText(text, x + CANVAS_SPACE[3], y + h / 2);
    ctx.textBaseline = 'top';
}

export interface EmptyCardOptions {
    radius?: number;
    fillStyle?: string;
}

/** 空状态占位卡片(居中 muted 文本) */
export function renderEmptyCard(
    ctx: Canvas2DContext,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    options: EmptyCardOptions = {},
): void {
    renderCard(ctx, x, y, w, h, options);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = buildCanvasFont(
        CANVAS_FONT.size.base,
        CANVAS_FONT.weight.normal,
        'sans',
    );
    ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
    ctx.fillText(text, x + w / 2, y + h / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
}
