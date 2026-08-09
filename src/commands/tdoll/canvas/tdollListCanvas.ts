import { BaseCanvas, CanvasSize } from '../../../services/baseCanvas';
import { Canvas2DContext } from '../../../services/canvasBackend';
import { buildCanvasFont, CANVAS_FONT } from '../../../services/canvasFonts';
import {
    TextSegment,
    measureSegmentsWidth,
} from '../../../services/canvasHelpers';
import {
    clampCanvasWidth,
    renderPageTitle,
} from '../../../services/canvasLayout';
import { CANVAS_COLORS, CANVAS_SPACE } from '../../../services/canvasTheme';
import { ITDollDataItem } from '../types/types';
import { loadTDollAvatarMap } from './assets';
import {
    CARD_GAP,
    CARD_H,
    CARD_W,
    buildCardModel,
    computeCardGridLayout,
    drawTDollCard,
} from './cardRenderer';
import { buildQueryTitleSegments } from './queryTitle';

const PAD = CANVAS_SPACE[6];
const TITLE_H = 56;
const FOOTER_H = 40;

/**
 * TDoll 匹配列表画布 — 自适应双列卡片(≤3 项单列, ≥4 项双列), 展示全部匹配结果。
 */
export class TDollListCanvas extends BaseCanvas {
    private readonly query: string;
    private readonly tdolls: ITDollDataItem[];
    private readonly fileName: string;

    private avatarMap: Awaited<ReturnType<typeof loadTDollAvatarMap>> | null =
        null;
    private cols = 1;

    constructor(query: string, tdolls: ITDollDataItem[], fileName: string) {
        super();
        this.query = query;
        this.tdolls = tdolls;
        this.fileName = fileName;
    }

    private buildTitleStatSegments(): TextSegment[] {
        const statFont = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        return [
            {
                text: `共 ${this.tdolls.length} 项`,
                color: CANVAS_COLORS.TEXT_MUTED,
                font: statFont,
            },
        ];
    }

    private renderTitle(
        ctx: Canvas2DContext,
        width: number,
    ): number {
        const statSegments = this.buildTitleStatSegments();
        const statWidth = measureSegmentsWidth(ctx, statSegments);
        const titleSegments = buildQueryTitleSegments(
            ctx,
            this.query,
            width - PAD * 2 - statWidth - CANVAS_SPACE[4],
        );
        return renderPageTitle(
            ctx,
            PAD,
            PAD,
            '查询 匹配结果',
            statSegments,
            {
                titleSegments,
                rightX: width - PAD,
            },
        );
    }

    protected async measure(): Promise<CanvasSize> {
        this.avatarMap = await loadTDollAvatarMap(this.tdolls);

        const { cols, rows } = computeCardGridLayout(this.tdolls.length);
        this.cols = cols;
        const width = clampCanvasWidth(
            PAD * 2 + cols * CARD_W + (cols - 1) * CARD_GAP,
        );
        const height =
            PAD + TITLE_H + rows * CARD_H + (rows - 1) * CARD_GAP + FOOTER_H;

        return { width, height };
    }

    protected getFileName(): string {
        return this.fileName;
    }

    protected getBgColor(): string {
        return CANVAS_COLORS.BG;
    }

    protected getRenderScene(): string {
        return 'tdollList:render';
    }

    protected getInputSummary(): string {
        return `query=${this.query}, count=${this.tdolls.length}`;
    }

    protected paint(ctx: Canvas2DContext, size: CanvasSize): number {
        this.renderTitle(ctx, size.width);

        this.tdolls.forEach((tdoll, i) => {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);
            const x = PAD + col * (CARD_W + CARD_GAP);
            const y = PAD + TITLE_H + row * (CARD_H + CARD_GAP);
            drawTDollCard(
                ctx,
                x,
                y,
                buildCardModel(tdoll, this.query),
                this.avatarMap!,
            );
        });

        return size.height - FOOTER_H;
    }
}
