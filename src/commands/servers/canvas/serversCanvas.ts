import { createCanvas, Canvas2DContext } from '../../../services/canvasBackend';
import { HistoricalServerItem, OnlineServerItem } from '../types/types';
import {
    getServerInfoDisplaySectionText,
    getCountColor,
    getMapShortName,
    formatMapDuration,
} from '../utils/utils';
import { BaseCanvas, CanvasSize } from '../../../services/baseCanvas';
import { buildCanvasFont, CANVAS_FONT } from '../../../services/canvasFonts';
import {
    drawSegments,
    measureSegmentsWidth,
    truncate,
    TextSegment,
} from '../../../services/canvasHelpers';
import { CANVAS_COLORS, CANVAS_RADIUS, CANVAS_SPACE } from '../../../services/canvasTheme';
import {
    clampCanvasWidth,
    renderCard,
    renderPageTitle,
    renderSectionHeader,
} from '../../../services/canvasLayout';

// ============================================================================
// 布局常量(统一走设计 token, 见 src/services/canvasTheme.ts / canvasLayout.ts)
// ============================================================================
const PAD = CANVAS_SPACE[6]; // 页面外边缘 24
const TITLE_H = 56;
const SECTION_GAP = CANVAS_SPACE[4];

const CARD_GAP = CANVAS_SPACE[3]; // 卡片垂直间距 12
const CARD_PAD_X = CANVAS_SPACE[4]; // 卡片左右内边距 16
const CARD_PAD_Y = CANVAS_SPACE[4]; // 卡片上下内边距 16
const NAME_H = 28; // 卡片第一行(服务器名)行高
const NAME_TO_META_GAP = 6; // 名称行与元信息行之间的间距
const META_H = 22; // 卡片第二行(元信息)行高

const SECTION_HEADER_H = 40;
const OFFLINE_ROW_H = 28;

const FOOTER_H = 40;

// 配色统一取自共享主题
const COLOR_TEXT = CANVAS_COLORS.TEXT;
const COLOR_MUTED = CANVAS_COLORS.TEXT_MUTED;
const MAP_TEXT_COLOR = CANVAS_COLORS.TEXT;

const TITLE_TEXT = '在线服务器';
const HISTORY_SECTION_TITLE = '近5分钟离线服务器';
const TITLE_GAP = 40; // 标题左侧文字与右侧统计之间的最小间距

/**
 * 服务器列表画布 — 卡片式布局(与 PlayersCanvas 设计语言一致):
 *   标题 + 每个在线服务器一张圆角卡片(名称行 + 元信息行) + 近期离线区块 + 页脚
 * 画布宽度 clamp 到 [560, 880]。
 */
export class ServersCanvas extends BaseCanvas {
    serverList: OnlineServerItem[];
    historicalServers: HistoricalServerItem[];
    fileName: string;
    mapStartedAtMap: Map<string, number | null>;

    // render params data
    renderWidth = 0;
    renderHeight = 0;
    totalFooter = '';

    constructor(
        serverList: OnlineServerItem[],
        historicalServers: HistoricalServerItem[],
        fileName: string,
        mapStartedAtMap: Map<string, number | null> = new Map(),
    ) {
        super();
        this.serverList = serverList;
        this.historicalServers = historicalServers;
        this.fileName = fileName;
        this.mapStartedAtMap = mapStartedAtMap;
    }

    private serverKey(server: OnlineServerItem): string {
        return `${server.address}:${server.port}`;
    }

    /** 卡片元信息行分段(人数 + 地图 + 时长) */
    private buildMetaSegments(server: OnlineServerItem): TextSegment[] {
        const sec = getServerInfoDisplaySectionText(server);
        const mapName = getMapShortName(server.map_id);
        const duration = formatMapDuration(
            this.mapStartedAtMap.get(this.serverKey(server)) ?? null,
        );
        return [
            {
                text: sec.playersSection,
                color: getCountColor(
                    server.current_players,
                    server.max_players,
                ),
                font: buildCanvasFont(
                    CANVAS_FONT.size.lg,
                    CANVAS_FONT.weight.bold,
                    'mono',
                ),
            },
            {
                text: ' 玩家  ·  ',
                color: COLOR_MUTED,
                font: buildCanvasFont(
                    CANVAS_FONT.size.base,
                    CANVAS_FONT.weight.normal,
                    'sans',
                ),
            },
            {
                text: mapName,
                color: MAP_TEXT_COLOR,
                font: buildCanvasFont(
                    CANVAS_FONT.size.base,
                    CANVAS_FONT.weight.bold,
                    'sans',
                ),
            },
            {
                text: '  ·  ',
                color: COLOR_MUTED,
                font: buildCanvasFont(
                    CANVAS_FONT.size.base,
                    CANVAS_FONT.weight.normal,
                    'sans',
                ),
            },
            {
                text: duration,
                color: COLOR_MUTED,
                font: buildCanvasFont(
                    CANVAS_FONT.size.sm,
                    CANVAS_FONT.weight.normal,
                    'sans',
                ),
            },
        ];
    }

    /** 组装离线服务器行的分段(弱化配色) */
    private buildOfflineSegments(server: HistoricalServerItem): TextSegment[] {
        const sec = getServerInfoDisplaySectionText(server);
        const elapsedMin = Math.ceil((Date.now() - server.lastSeenAt) / 60000);
        return [
            {
                text: sec.serverSection,
                color: COLOR_MUTED,
                font: buildCanvasFont(
                    CANVAS_FONT.size.sm,
                    CANVAS_FONT.weight.normal,
                    'sans',
                ),
            },
            {
                text: sec.playersSection,
                color: COLOR_MUTED,
                font: buildCanvasFont(
                    CANVAS_FONT.size.sm,
                    CANVAS_FONT.weight.normal,
                    'sans',
                ),
            },
            {
                text: sec.mapSection,
                color: CANVAS_COLORS.MUTED_DIM,
                font: buildCanvasFont(
                    CANVAS_FONT.size.sm,
                    CANVAS_FONT.weight.normal,
                    'sans',
                ),
            },
            {
                text: `  ${elapsedMin}分钟前`,
                color: CANVAS_COLORS.MUTED_DIMMER,
                font: buildCanvasFont(
                    CANVAS_FONT.size.sm,
                    CANVAS_FONT.weight.normal,
                    'sans',
                ),
            },
        ];
    }

    /** 标题右侧的概览统计分段 */
    private buildTitleStatSegments(): TextSegment[] {
        const totalPlayers = this.serverList.reduce(
            (acc, s) => acc + s.current_players,
            0,
        );
        const totalCapacity = this.serverList.reduce(
            (acc, s) => acc + s.max_players,
            0,
        );
        const labelFont = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        const valueFont = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.bold,
            'mono',
        );
        return [
            {
                text: `${this.serverList.length}`,
                color: COLOR_TEXT,
                font: valueFont,
            },
            { text: ' 服务器  ·  ', color: COLOR_MUTED, font: labelFont },
            {
                text: `${totalPlayers}/${totalCapacity}`,
                color: getCountColor(totalPlayers, totalCapacity),
                font: valueFont,
            },
            { text: ' 玩家在线', color: COLOR_MUTED, font: labelFont },
        ];
    }

    private cardHeight(): number {
        return (
            CARD_PAD_Y +
            NAME_H +
            NAME_TO_META_GAP +
            META_H +
            CARD_PAD_Y
        );
    }

    /**
     * 测量阶段: 计算画布宽高(clamp 到 [560, 880])。
     */
    private prepare() {
        const tmp = createCanvas(1, 1);
        const ctx = tmp.getContext('2d');

        // (1) 卡片内容最大宽(名称行 / 元信息行)
        let cardContentW = 0;
        ctx.font = buildCanvasFont(CANVAS_FONT.size.lg, 'bold', 'sans');
        this.serverList.forEach((s) => {
            cardContentW = Math.max(cardContentW, ctx.measureText(s.name).width);
            cardContentW = Math.max(
                cardContentW,
                measureSegmentsWidth(ctx, this.buildMetaSegments(s)),
            );
        });

        // (2) 估算 footer 宽(renderFooter 写入 this.totalFooter; 禁用时为空)
        this.renderFooter(ctx);
        ctx.font = buildCanvasFont(CANVAS_FONT.size.xs);
        const footerW = this.totalFooter
            ? ctx.measureText(this.totalFooter).width
            : 0;

        // (3) 标题宽 / 离线区块宽
        const titleStatW = measureSegmentsWidth(
            ctx,
            this.buildTitleStatSegments(),
        );
        ctx.font = buildCanvasFont(CANVAS_FONT.size['2xl'], 'bold', 'sans');
        const titleLeftW = ctx.measureText(TITLE_TEXT).width;
        const titleW = titleLeftW + TITLE_GAP + titleStatW;

        let offlineW = 0;
        if (this.historicalServers.length > 0) {
            ctx.font = buildCanvasFont(CANVAS_FONT.size.xl, 'bold', 'sans');
            offlineW = ctx.measureText(HISTORY_SECTION_TITLE).width + 14;
            this.historicalServers.forEach((s) => {
                offlineW = Math.max(
                    offlineW,
                    measureSegmentsWidth(ctx, this.buildOfflineSegments(s)),
                );
            });
        }

        // (4) 整图宽高(内容自然宽 clamp)
        const naturalW = Math.max(
            PAD * 2 + titleW,
            PAD * 2 + cardContentW + CARD_PAD_X * 2,
            PAD * 2 + offlineW,
            20 + footerW,
        );
        this.renderWidth = clampCanvasWidth(naturalW);
        this.renderHeight = this.computeHeight();
    }

    private computeHeight(): number {
        let h = PAD + TITLE_H;

        this.serverList.forEach((_, i) => {
            h += this.cardHeight();
            if (i < this.serverList.length - 1) {
                h += CARD_GAP;
            }
        });

        if (this.serverList.length > 0) {
            h += SECTION_GAP;
        }

        if (this.historicalServers.length > 0) {
            h +=
                SECTION_HEADER_H +
                this.historicalServers.length * OFFLINE_ROW_H +
                SECTION_GAP;
        }

        h += FOOTER_H;
        return Math.ceil(h);
    }

    private renderTitle(ctx: Canvas2DContext, y: number): number {
        return renderPageTitle(
            ctx,
            PAD,
            y,
            TITLE_TEXT,
            this.buildTitleStatSegments(),
            { rightX: this.renderWidth - PAD },
        );
    }

    private renderServerCards(ctx: Canvas2DContext, y: number): number {
        const cardX = PAD;
        const cardW = this.renderWidth - PAD * 2;
        const contentW = cardW - CARD_PAD_X * 2;
        const cardH = this.cardHeight();

        this.serverList.forEach((server, i) => {
            // 卡片背景 + 投影
            renderCard(ctx, cardX, y, cardW, cardH);

            // 名称行
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.font = buildCanvasFont(CANVAS_FONT.size.lg, 'bold', 'sans');
            ctx.fillStyle = COLOR_TEXT;
            ctx.fillText(
                truncate(ctx, server.name, contentW),
                cardX + CARD_PAD_X,
                y + CARD_PAD_Y + NAME_H / 2,
            );

            // 元信息行
            drawSegments(
                ctx,
                cardX + CARD_PAD_X,
                y + CARD_PAD_Y + NAME_H + NAME_TO_META_GAP + META_H / 2,
                this.buildMetaSegments(server),
                'left',
            );

            y += cardH;
            if (i < this.serverList.length - 1) {
                y += CARD_GAP;
            }
        });

        if (this.serverList.length > 0) {
            y += SECTION_GAP;
        }
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        return y;
    }

    private renderOfflineSection(ctx: Canvas2DContext, y: number): number {
        if (this.historicalServers.length === 0) {
            return y;
        }

        y = renderSectionHeader(ctx, y, HISTORY_SECTION_TITLE, '', {
            x: PAD,
            rightX: this.renderWidth - PAD,
        });

        this.historicalServers.forEach((server) => {
            const midY = y + OFFLINE_ROW_H / 2;
            ctx.textBaseline = 'middle';
            drawSegments(
                ctx,
                PAD,
                midY,
                this.buildOfflineSegments(server),
                'left',
            );
            y += OFFLINE_ROW_H;
        });

        y += SECTION_GAP;
        ctx.textBaseline = 'top';
        return y;
    }

    protected measure(): CanvasSize {
        this.prepare();
        return { width: this.renderWidth, height: this.renderHeight };
    }

    protected getFileName(): string {
        return this.fileName;
    }

    protected getBgColor(): string {
        return CANVAS_COLORS.BG;
    }

    protected paint(ctx: Canvas2DContext): number {
        let y = PAD;
        y = this.renderTitle(ctx, y);
        y = this.renderServerCards(ctx, y);
        y = this.renderOfflineSection(ctx, y);
        return y;
    }
}
