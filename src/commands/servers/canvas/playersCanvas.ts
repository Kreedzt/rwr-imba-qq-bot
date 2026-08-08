import { createCanvas, Canvas2DContext } from '../../../services/canvasBackend';
import { HistoricalServerItem, OnlineServerItem } from '../types/types';
import {
    getServerInfoDisplaySectionText,
    getCountColor,
    getPlayersInServer,
    formatMapDuration,
} from '../utils/utils';
import { BaseCanvas, CanvasSize } from '../../../services/baseCanvas';
import { buildCanvasFont, CANVAS_FONT } from '../../../services/canvasFonts';
import {
    drawSegments,
    measureSegmentsWidth,
    layoutChips,
    ChipLayout,
    ChipItem,
    TextSegment,
    CHIP_FONT_PT,
    CHIP_PAD_X,
    CHIP_H,
    CHIP_GAP_X,
    CHIP_GAP_Y,
} from '../../../services/canvasHelpers';
import {
    CANVAS_COLORS,
    CANVAS_SPACE,
} from '../../../services/canvasTheme';
import {
    CANVAS_CARD_CONTENT_MAX_W,
    buildTruncatedNameSegments,
    clampCanvasWidth,
    renderCard,
    renderChip,
    renderPageTitle,
    renderSectionHeader,
} from '../../../services/canvasLayout';

const MODERATOR_BADGE_DEFAULT = '⭐';

// ============================================================================
// 布局常量(统一走设计 token, 见 src/services/canvasTheme.ts / canvasLayout.ts)
// ============================================================================
const PAD = CANVAS_SPACE[6];
const TITLE_H = 56;
const SECTION_GAP = CANVAS_SPACE[4];

const CARD_GAP = CANVAS_SPACE[3];
const CARD_PAD_X = CANVAS_SPACE[4];
const CARD_PAD_Y = CANVAS_SPACE[4];
const HEADER_H = 30; // 卡片头部行高(服务器名行)
const HEADER_TO_CHIP_GAP = 10;
const EMPTY_PLACEHOLDER_H = CHIP_H; // 0 玩家时占位行高

const SECTION_HEADER_H = 40;
const OFFLINE_ROW_H = 28;

const FOOTER_H = 40;

const WRAP_W_MIN = 360; // chip 区目标换行宽下限
const WRAP_W_MAX = 760; // chip 区目标换行宽上限(控制图片不要过宽)

// 配色统一取自共享主题
const COLOR_TEXT = CANVAS_COLORS.TEXT;
const COLOR_MUTED = CANVAS_COLORS.TEXT_MUTED;
const COLOR_VALUE = CANVAS_COLORS.VALUE;
const MAP_TEXT_COLOR = CANVAS_COLORS.TEXT;

// chip 配色
const CHIP_BG_NORMAL = CANVAS_COLORS.CHIP_BG;
const CHIP_BG_MODERATOR = CANVAS_COLORS.CHIP_BG_ACCENT;
const CHIP_TEXT_NORMAL = CANVAS_COLORS.INFO; // 普通玩家文本

const TITLE_TEXT = '在线玩家分布';
const HISTORY_SECTION_TITLE = '近5分钟离线服务器';
const TITLE_GAP = 40; // 标题左侧文字与右侧统计之间的最小间距

/**
 * 玩家分布画布 — 卡片式布局(与 ServerOverviewCanvas 设计语言一致):
 *   标题 + 每个在线服务器一张圆角卡片(头部信息 + 玩家 chip 流式排布) + 近期离线区块 + 页脚
 * 画布宽度 clamp 到 [560, 880]。
 */
export class PlayersCanvas extends BaseCanvas {
    serverList: OnlineServerItem[];
    historicalServers: HistoricalServerItem[];
    fileName: string;
    moderators: string[];
    moderatorBadge: string;
    mapStartedAtMap: Map<string, number | null>;

    // render params data
    renderWidth = 0;
    renderHeight = 0;
    targetWrapW = WRAP_W_MIN;
    serverLayouts: ChipLayout[] = [];

    constructor(
        serverList: OnlineServerItem[],
        historicalServers: HistoricalServerItem[],
        fileName: string,
        mapStartedAtMap: Map<string, number | null> = new Map(),
        moderators?: string[],
        moderatorBadge?: string,
    ) {
        super();
        this.serverList = serverList;
        this.historicalServers = historicalServers;
        this.fileName = fileName;
        this.mapStartedAtMap = mapStartedAtMap;
        this.moderators = moderators ?? [];
        this.moderatorBadge = moderatorBadge ?? MODERATOR_BADGE_DEFAULT;
    }

    private isModerator(playerName: string): boolean {
        return this.moderators.some(
            (m) => m.toUpperCase() === playerName.toUpperCase(),
        );
    }

    private getPlayerDisplayName(playerName: string): string {
        return this.isModerator(playerName)
            ? `${playerName} ${this.moderatorBadge}`
            : playerName;
    }

    private chipItemsOf(server: OnlineServerItem): ChipItem[] {
        return getPlayersInServer(server).map((name) => ({
            displayName: this.getPlayerDisplayName(name),
            isModerator: this.isModerator(name),
        }));
    }

    private serverKey(server: OnlineServerItem): string {
        return `${server.address}:${server.port}`;
    }

    /** 组装卡片头部分段(服务器名 + 人数 + 地图 + 时长); 服务器名按可用宽截断 */
    private buildHeaderSegments(
        server: OnlineServerItem,
        ctx: Canvas2DContext,
    ): TextSegment[] {
        const sec = getServerInfoDisplaySectionText(server);
        const duration = formatMapDuration(
            this.mapStartedAtMap.get(this.serverKey(server)) ?? null,
        );
        const tail: TextSegment[] = [
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
                text: sec.mapSection,
                color: MAP_TEXT_COLOR,
                font: buildCanvasFont(
                    CANVAS_FONT.size.base,
                    CANVAS_FONT.weight.bold,
                    'sans',
                ),
            },
            {
                text: ` ${duration}`,
                color: COLOR_MUTED,
                font: buildCanvasFont(
                    CANVAS_FONT.size.sm,
                    CANVAS_FONT.weight.normal,
                    'sans',
                ),
            },
        ];
        const nameFont = buildCanvasFont(
            CANVAS_FONT.size.lg,
            CANVAS_FONT.weight.bold,
            'sans',
        );
        return buildTruncatedNameSegments(
            ctx,
            server.name,
            tail,
            CANVAS_CARD_CONTENT_MAX_W,
            nameFont,
        );
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
                text: `${totalPlayers}`,
                color: getCountColor(totalPlayers, totalCapacity),
                font: valueFont,
            },
            { text: ' 玩家在线', color: COLOR_MUTED, font: labelFont },
        ];
    }

    /** 单张卡片高度 */
    private cardHeight(layout: ChipLayout): number {
        const chipAreaH =
            layout.rows > 0 ? layout.chipAreaH : EMPTY_PLACEHOLDER_H;
        return (
            CARD_PAD_Y +
            HEADER_H +
            HEADER_TO_CHIP_GAP +
            chipAreaH +
            CARD_PAD_Y
        );
    }

    /**
     * 测量阶段: 确定唯一的目标换行宽, 缓存各服务器 chip 布局, 计算画布宽高。
     * measure 与 render 复用同一 layout 缓存, 保证两遍布局逐 chip 一致。
     */
    private prepare() {
        const tmp = createCanvas(1, 1);
        const ctx = tmp.getContext('2d');

        // (1) 头行最大宽(服务器名按可用宽截断)
        let headerMaxW = 0;
        this.serverList.forEach((s) => {
            headerMaxW = Math.max(
                headerMaxW,
                measureSegmentsWidth(ctx, this.buildHeaderSegments(s, ctx)),
            );
        });

        // (2) 单 chip 最大宽(保证最宽 chip 放得下)
        ctx.font = buildCanvasFont(CHIP_FONT_PT);
        let chipMaxSingle = 0;
        this.serverList.forEach((s) => {
            this.chipItemsOf(s).forEach((it) => {
                const w = ctx.measureText(it.displayName).width + CHIP_PAD_X * 2;
                chipMaxSingle = Math.max(chipMaxSingle, w);
            });
        });

        // (3) 目标换行宽
        this.targetWrapW = Math.max(
            Math.min(Math.max(headerMaxW, WRAP_W_MIN), WRAP_W_MAX),
            chipMaxSingle,
        );

        // (4) 每服务器 wrap 并缓存
        this.serverLayouts = this.serverList.map((s) =>
            layoutChips(ctx, this.chipItemsOf(s), this.targetWrapW),
        );
        const maxChipLineW = this.serverLayouts.reduce(
            (m, l) => Math.max(m, l.maxLineWidth),
            0,
        );

        // (5) 估算 footer 宽(renderFooter 写入 this.totalFooter; 禁用时为空)
        this.renderFooter(ctx);
        ctx.font = buildCanvasFont(CANVAS_FONT.size.xs);
        const footerW = this.totalFooter
            ? ctx.measureText(this.totalFooter).width
            : 0;

        // (6) 标题宽 / 离线区块宽
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

        // (7) 整图宽高(内容自然宽 clamp)
        const naturalW = Math.max(
            PAD * 2 + titleW,
            PAD * 2 + Math.max(headerMaxW, maxChipLineW) + CARD_PAD_X * 2,
            PAD * 2 + offlineW,
            20 + footerW,
        );
        this.renderWidth = clampCanvasWidth(naturalW);
        this.renderHeight = this.computeHeight();
    }

    private computeHeight(): number {
        let h = PAD + TITLE_H;

        this.serverLayouts.forEach((layout, i) => {
            h += this.cardHeight(layout);
            if (i < this.serverLayouts.length - 1) {
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

        this.serverList.forEach((server, i) => {
            const layout = this.serverLayouts[i];
            const cardH = this.cardHeight(layout);

            // 卡片背景 + 投影
            renderCard(ctx, cardX, y, cardW, cardH);

            // 头部信息行
            ctx.textBaseline = 'middle';
            drawSegments(
                ctx,
                cardX + CARD_PAD_X,
                y + CARD_PAD_Y + HEADER_H / 2,
                this.buildHeaderSegments(server, ctx),
                'left',
            );

            // chip 区
            const chipX0 = cardX + CARD_PAD_X;
            const chipY0 = y + CARD_PAD_Y + HEADER_H + HEADER_TO_CHIP_GAP;

            if (layout.rows === 0) {
                ctx.font = buildCanvasFont(
                    CANVAS_FONT.size.base,
                    CANVAS_FONT.weight.normal,
                    'sans',
                );
                ctx.fillStyle = COLOR_MUTED;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText('暂无玩家', chipX0, chipY0 + CHIP_H / 2);
            } else {
                layout.lines.forEach((line, rowIdx) => {
                    const rowY = chipY0 + rowIdx * (CHIP_H + CHIP_GAP_Y);
                    let cx = chipX0;
                    line.chips.forEach((chip) => {
                        renderChip(ctx, cx, rowY, chip.w, CHIP_H, chip.text, {
                            bg: chip.isModerator
                                ? CHIP_BG_MODERATOR
                                : CHIP_BG_NORMAL,
                            borderColor: chip.isModerator
                                ? CANVAS_COLORS.AMBER_500
                                : undefined,
                            textColor: chip.isModerator
                                ? COLOR_VALUE
                                : CHIP_TEXT_NORMAL,
                        });
                        cx += chip.w + CHIP_GAP_X;
                    });
                });
            }

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
