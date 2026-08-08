import {
    createCanvas,
    type Canvas2DContext,
} from '../../../services/canvasBackend';
import { BaseCanvas, CanvasSize } from '../../../services/baseCanvas';
import { buildCanvasFont, CANVAS_FONT } from '../../../services/canvasFonts';
import { roundRectPath } from '../../../services/canvasHelpers';
import {
    CANVAS_COLORS,
    CANVAS_SPACE,
} from '../../../services/canvasTheme';
import {
    CANVAS_MAX_WIDTH,
    renderCard,
    renderSectionHeader,
} from '../../../services/canvasLayout';

export type HelpCanvasModel =
    | {
          mode: 'list';
          prefix: string;
          items: Array<{ name: string; alias?: string; description: string }>;
      }
    | {
          mode: 'detail';
          prefix: string;
          name: string;
          alias?: string;
          description: string;
          hints: string[];
      }
    | {
          mode: 'not_found';
          prefix: string;
          query: string;
      }
    | {
          mode: 'welcome';
          title: string;
          subtitle?: string;
          prefix: string;
          items: Array<{ name: string; alias?: string; description: string }>;
      };

type WrappedEntry = {
    cmdLabel: string;
    aliasLabel: string | null;
    descLines: string[];
    cardH: number;
};

const CJK = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;

/**
 * 字符级折行(单词/数字不被硬拆, CJK 字符可逐字断行)。
 * 空白与 CJK 字符都是断行机会; 连续 latin/digit 视为一个 token,
 * 仅当单个 token 超宽时才逐字拆开。
 */
function wrapText(
    context: Canvas2DContext,
    text: string,
    maxWidth: number,
): string[] {
    const normalized = text.replace(/\r\n/g, '\n');
    const paragraphs = normalized.split('\n');
    const lines: string[] = [];

    for (const paragraph of paragraphs) {
        if (!paragraph) {
            lines.push('');
            continue;
        }

        // 拆成可断行单元: 空白/CJK 各自独立成单元, latin/digit 连续成词
        const units: string[] = [];
        let buf = '';
        for (const ch of paragraph) {
            if (ch === ' ' || CJK.test(ch)) {
                if (buf) {
                    units.push(buf);
                    buf = '';
                }
                units.push(ch);
            } else {
                buf += ch;
            }
        }
        if (buf) {
            units.push(buf);
        }

        let line = '';
        for (const u of units) {
            const trial = line ? line + u : u;
            if (line && context.measureText(trial).width > maxWidth) {
                lines.push(line);
                line = u;
            } else {
                line = trial;
            }
            // 单个超宽 token(如超长 URL)逐字拆开
            while (context.measureText(line).width > maxWidth && line.length > 1) {
                lines.push(line.slice(0, -1));
                line = line.slice(-1);
            }
        }
        lines.push(line);
    }

    return lines;
}

// ============================================================================
// 布局常量(与 servers/players 家族统一: 880 宽 + 24 pad + 卡片设计语言)
// ============================================================================
const WIDTH = CANVAS_MAX_WIDTH;
const PAD = CANVAS_SPACE[6];
const CONTENT_W = WIDTH - PAD * 2;

const TITLE_H = 56;
const SUBTITLE_LINE_H = 20;
const HEADER_TO_CARDS_GAP = 12;

const CARD_PAD = CANVAS_SPACE[4];
const CARD_GAP = CANVAS_SPACE[3];
const CMD_ROW_H = 28; // 卡片标题行(命令名 + 别名 pill)
const DESC_LINE_H = 22; // 描述行高(base 字号)
const CMD_COL_MIN = 140; // 命令列宽下限
const CMD_COL_MAX = 300; // 命令列宽上限
const CMD_TO_DESC_GAP = 16;

const ALIAS_PAD_X = 8; // 别名 pill 左右内边距
const ALIAS_PILL_H = 20; // 别名 pill 高度

const SECTION_HEADER_H = 40;
const HINT_ROW_H = 22;
const EMPTY_CARD_H = 64;

const FOOTER_H = 40;

/**
 * 帮助画布 — 与 servers/players 家族统一的卡片设计语言:
 *   页面标题(2xl) + 副标题(sm muted) + 命令卡片列表 / 详情卡片 + 页脚
 * 画布宽度固定 880。
 */
export class HelpCanvas extends BaseCanvas {
    private readonly model: HelpCanvasModel;
    private readonly fileName: string;

    private readonly renderWidth = WIDTH;
    private renderHeight = 600;

    private subtitleLines: string[] = [];
    private wrappedEntries: WrappedEntry[] = [];
    private cmdColW = CMD_COL_MIN;

    // detail / not_found 模式的内部卡片高度与折行缓存(measure 与 paint 共用同一结果)
    private detailCardH = 0;
    private usageCardH = 0;
    private notFoundCardH = 0;
    private detailDescLines: string[] = [];
    private usageHintLines: string[][] = [];
    private notFoundLines: string[] = [];

    constructor(model: HelpCanvasModel, fileName: string) {
        super();
        this.model = model;
        this.fileName = fileName;
    }

    // ------------------------------------------------------------------
    // 布局计算
    // ------------------------------------------------------------------

    private aliasHint(): string {
        return `括号内为别名缩写，可直接使用，如 ${this.model.prefix}h 等同 ${this.model.prefix}help`;
    }

    private subtitle(): string {
        const { prefix } = this.model;
        switch (this.model.mode) {
            case 'list':
                return `共 ${this.model.items.length} 个命令 | 用法: ${prefix}help <cmd> | 也可用 ${prefix}h\n${this.aliasHint()}`;
            case 'welcome':
                return `${
                    this.model.subtitle ??
                    `用法: ${prefix}help <cmd> | 也可用 ${prefix}h`
                }\n${this.aliasHint()}`;
            case 'detail':
                return `别名: ${
                    this.model.alias ? prefix + this.model.alias : '无'
                } | 用法: ${prefix}help ${this.model.name}`;
            case 'not_found':
                return `用法: ${prefix}help | ${prefix}help <cmd>`;
        }
    }

    private pageTitle(): string {
        switch (this.model.mode) {
            case 'list':
                return '帮助列表';
            case 'welcome':
                return this.model.title;
            case 'detail':
                return '帮助详情';
            case 'not_found':
                return '未找到命令';
        }
    }

    private aliasPillW(
        ctx: Canvas2DContext,
        aliasLabel: string | null,
    ): number {
        if (!aliasLabel) {
            return 0;
        }
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.bold,
            'mono',
        );
        return ctx.measureText(aliasLabel).width + ALIAS_PAD_X * 2;
    }

    private entryCmdWidth(
        ctx: Canvas2DContext,
        entry: {
            cmdLabel: string;
            aliasLabel: string | null;
        },
    ): number {
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.lg,
            CANVAS_FONT.weight.bold,
            'mono',
        );
        return (
            ctx.measureText(entry.cmdLabel).width +
            (entry.aliasLabel ? this.aliasPillW(ctx, entry.aliasLabel) + 8 : 0)
        );
    }

    private prepareLayout(): void {
        const tmp = createCanvas(1, 1);
        const ctx = tmp.getContext('2d');

        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        this.subtitleLines = wrapText(ctx, this.subtitle(), CONTENT_W);

        // 正文折行统一使用与 paint 相同的字体(base sans normal), 保证行数一致
        const bodyFont = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.normal,
            'sans',
        );

        this.wrappedEntries = [];

        if (this.model.mode === 'list' || this.model.mode === 'welcome') {
            const items = this.model.items;
            const rawEntries = items.map((it) => ({
                cmdLabel: `${this.model.prefix}${it.name}`,
                aliasLabel: it.alias ? `${this.model.prefix}${it.alias}` : null,
            }));

            // 命令列宽 = 最宽 cmd 标签 + 别名 pill, clamp 到 [140, 300]
            const maxCmdW = Math.max(
                CMD_COL_MIN,
                ...rawEntries.map((e) => this.entryCmdWidth(ctx, e)),
            );
            this.cmdColW = Math.min(maxCmdW, CMD_COL_MAX);

            this.wrappedEntries = items.map((it, idx) => {
                const e = rawEntries[idx];
                const descMaxW =
                    CONTENT_W - CARD_PAD * 2 - this.cmdColW - CMD_TO_DESC_GAP;
                ctx.font = bodyFont;
                const descLines = wrapText(ctx, it.description, descMaxW);
                const descH = descLines.length * DESC_LINE_H;
                const cardH =
                    CARD_PAD +
                    Math.max(descH, CMD_ROW_H) +
                    CARD_PAD;
                return {
                    cmdLabel: e.cmdLabel,
                    aliasLabel: e.aliasLabel,
                    descLines,
                    cardH,
                };
            });
        } else if (this.model.mode === 'detail') {
            ctx.font = bodyFont;
            this.detailDescLines = wrapText(
                ctx,
                this.model.description,
                CONTENT_W - CARD_PAD * 2,
            );
            this.detailCardH =
                CARD_PAD +
                CMD_ROW_H +
                6 +
                this.detailDescLines.length * DESC_LINE_H +
                CARD_PAD;

            const hintW = CONTENT_W - CARD_PAD * 2 - 24;
            this.usageHintLines = this.model.hints.map((h) =>
                wrapText(ctx, `• ${h}`, hintW),
            );
            const hintLines =
                this.model.hints.length > 0
                    ? this.usageHintLines.reduce(
                          (n, ls) => n + ls.length,
                          0,
                      )
                    : 1;
            this.usageCardH =
                CARD_PAD + hintLines * HINT_ROW_H + CARD_PAD;
        } else {
            ctx.font = bodyFont;
            this.notFoundLines = wrapText(
                ctx,
                this.notFoundHint(),
                CONTENT_W - CARD_PAD * 2,
            );
            this.notFoundCardH = Math.max(
                EMPTY_CARD_H,
                CARD_PAD + this.notFoundLines.length * HINT_ROW_H + CARD_PAD,
            );
        }

        this.renderHeight = this.computeHeight();
    }

    private notFoundHint(): string {
        const model = this.model as Extract<HelpCanvasModel, { mode: 'not_found' }>;
        return `未找到与 "${model.query}" 匹配的命令。使用 ${model.prefix}help 查看可用命令列表, 或 ${model.prefix}help <cmd> 查看命令详情。`;
    }

    private computeHeight(): number {
        let h = PAD + TITLE_H + this.subtitleLines.length * SUBTITLE_LINE_H;

        if (this.model.mode === 'list' || this.model.mode === 'welcome') {
            h += HEADER_TO_CARDS_GAP;
            this.wrappedEntries.forEach((e, i) => {
                h += e.cardH;
                if (i < this.wrappedEntries.length - 1) {
                    h += CARD_GAP;
                }
            });
        } else if (this.model.mode === 'detail') {
            h += HEADER_TO_CARDS_GAP + this.detailCardH;
            h += SECTION_HEADER_H + this.usageCardH;
        } else {
            h += HEADER_TO_CARDS_GAP + this.notFoundCardH;
        }

        h += FOOTER_H;
        return Math.ceil(h);
    }

    // ------------------------------------------------------------------
    // 绘制
    // ------------------------------------------------------------------

    private renderHeader(ctx: Canvas2DContext): number {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // 页面标题(2xl sans)
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size['2xl'],
            CANVAS_FONT.weight.bold,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.TEXT;
        ctx.fillText(this.pageTitle(), PAD, PAD);

        // 副标题(sm muted)
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
        let y = PAD + TITLE_H;
        for (const line of this.subtitleLines) {
            ctx.fillText(line, PAD, y);
            y += SUBTITLE_LINE_H;
        }

        return y + HEADER_TO_CARDS_GAP;
    }

    /** 命令卡片的标题行: 命令名(mono AMBER) + 别名 pill */
    private renderEntryTitle(
        ctx: Canvas2DContext,
        x: number,
        y: number,
        entry: WrappedEntry,
    ): number {
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.lg,
            CANVAS_FONT.weight.bold,
            'mono',
        );
        ctx.fillStyle = CANVAS_COLORS.AMBER_500;
        ctx.fillText(entry.cmdLabel, x, y + CMD_ROW_H / 2);
        let cx = x + ctx.measureText(entry.cmdLabel).width + 8;

        if (entry.aliasLabel) {
            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.sm,
                CANVAS_FONT.weight.bold,
                'mono',
            );
            const pillW = ctx.measureText(entry.aliasLabel).width + ALIAS_PAD_X * 2;
            ctx.fillStyle = CANVAS_COLORS.CHIP_BG;
            roundRectPath(
                ctx,
                cx,
                y + (CMD_ROW_H - ALIAS_PILL_H) / 2,
                pillW,
                ALIAS_PILL_H,
                ALIAS_PILL_H / 2,
            );
            ctx.fill();

            ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
            ctx.fillText(
                entry.aliasLabel,
                cx + ALIAS_PAD_X,
                y + CMD_ROW_H / 2,
            );
            cx += pillW + 8;
        }

        ctx.textBaseline = 'top';
        return cx;
    }

    private renderEntryCards(ctx: Canvas2DContext, y: number): number {
        this.wrappedEntries.forEach((entry, i) => {
            renderCard(ctx, PAD, y, CONTENT_W, entry.cardH);

            this.renderEntryTitle(ctx, PAD + CARD_PAD, y + CARD_PAD, entry);

            // 描述列(基于统一命令列宽对齐)
            const descX = PAD + CARD_PAD + this.cmdColW + CMD_TO_DESC_GAP;
            const descMaxW = PAD + CONTENT_W - CARD_PAD - descX;

            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.base,
                CANVAS_FONT.weight.normal,
                'sans',
            );
            ctx.fillStyle = CANVAS_COLORS.TEXT;
            entry.descLines.forEach((line, li) => {
                ctx.fillText(
                    line,
                    descX,
                    y + CARD_PAD + li * DESC_LINE_H,
                    Math.max(60, descMaxW),
                );
            });

            y += entry.cardH;
            if (i < this.wrappedEntries.length - 1) {
                y += CARD_GAP;
            }
        });

        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        return y;
    }

    private renderDetailCards(ctx: Canvas2DContext, y: number): number {
        const model = this.model;
        if (model.mode !== 'detail') {
            return y;
        }
        const { prefix, name, alias } = model;

        // 标题卡片: 命令名 + 别名 pill + 描述
        renderCard(ctx, PAD, y, CONTENT_W, this.detailCardH);
        const entry: WrappedEntry = {
            cmdLabel: `${prefix}${name}`,
            aliasLabel: alias ? `${prefix}${alias}` : null,
            descLines: [],
            cardH: this.detailCardH,
        };
        this.renderEntryTitle(ctx, PAD + CARD_PAD, y + CARD_PAD, entry);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.TEXT;
        this.detailDescLines.forEach((line, li) => {
            ctx.fillText(
                line,
                PAD + CARD_PAD,
                y + CARD_PAD + CMD_ROW_H + 6 + li * DESC_LINE_H,
            );
        });

        y += this.detailCardH;

        // 用法小节
        y = renderSectionHeader(ctx, y, '用法', '', {
            x: PAD,
            rightX: WIDTH - PAD,
        });
        renderCard(ctx, PAD, y, CONTENT_W, this.usageCardH);

        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        const hintX = PAD + CARD_PAD + 12;
        const hintMaxW = CONTENT_W - CARD_PAD * 2 - 24;
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.TEXT;
        let hy = y + CARD_PAD;
        if (this.usageHintLines.length > 0) {
            this.usageHintLines.forEach((lines) => {
                lines.forEach((line) => {
                    ctx.fillText(line, hintX, hy, Math.max(60, hintMaxW));
                    hy += HINT_ROW_H;
                });
            });
        } else {
            ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
            ctx.fillText('暂无更多帮助', hintX, hy);
            hy += HINT_ROW_H;
        }

        ctx.textBaseline = 'top';
        return y + this.usageCardH;
    }

    private renderNotFoundCard(ctx: Canvas2DContext, y: number): number {
        if (this.model.mode !== 'not_found') {
            return y;
        }

        // 空状态卡片: 未找到提示(两行居中)
        renderCard(ctx, PAD, y, CONTENT_W, this.notFoundCardH);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
        const midY = y + this.notFoundCardH / 2;
        const startY =
            midY - ((this.notFoundLines.length - 1) * HINT_ROW_H) / 2;
        this.notFoundLines.forEach((line, li) => {
            ctx.fillText(line, PAD + CONTENT_W / 2, startY + li * HINT_ROW_H);
        });

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        return y + this.notFoundCardH;
    }

    protected measure(): CanvasSize {
        this.prepareLayout();
        return { width: this.renderWidth, height: this.renderHeight };
    }

    protected getFileName(): string {
        return this.fileName;
    }

    protected getBgColor(): string {
        return CANVAS_COLORS.BG;
    }

    protected paint(context: Canvas2DContext): number {
        let y = this.renderHeader(context);

        if (this.model.mode === 'list' || this.model.mode === 'welcome') {
            y = this.renderEntryCards(context, y);
        } else if (this.model.mode === 'detail') {
            y = this.renderDetailCards(context, y);
        } else {
            y = this.renderNotFoundCard(context, y);
        }

        return y;
    }
}
