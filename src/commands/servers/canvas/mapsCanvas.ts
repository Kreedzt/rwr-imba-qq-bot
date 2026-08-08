import { createCanvas, Canvas2DContext } from '../../../services/canvasBackend';
import { IMapDataItem, OnlineServerItem } from '../types/types';
import {
    getCountColor,
    getServerInfoDisplaySectionText,
    getMapShortName,
    getMapTextInCanvas,
    formatMapDuration,
} from '../utils/utils';
import { BaseCanvas, CanvasSize } from '../../../services/baseCanvas';
import { buildCanvasFont, CANVAS_FONT } from '../../../services/canvasFonts';
import {
    roundRectPath,
    drawSegments,
    measureSegmentsWidth,
    truncate,
    TextSegment,
} from '../../../services/canvasHelpers';
import { CANVAS_COLORS, CANVAS_SPACE } from '../../../services/canvasTheme';
import {
    CANVAS_CARD_CONTENT_MAX_W,
    buildTruncatedNameSegments,
    clampCanvasWidth,
    renderCard,
    renderPageTitle,
} from '../../../services/canvasLayout';

// ============================================================================
// 布局常量(统一走设计 token, 见 src/services/canvasTheme.ts / canvasLayout.ts)
// ============================================================================
const PAD = CANVAS_SPACE[6];
const TITLE_H = 56;
const SECTION_GAP = CANVAS_SPACE[4];

const CARD_GAP = CANVAS_SPACE[3]; // 地图卡片之间的垂直间距 12
const CARD_PAD_X = CANVAS_SPACE[4];
const CARD_PAD_Y = CANVAS_SPACE[4];
const HEADER_H = 30; // 卡片头部行高(序号 + 地图名行)
const HEADER_TO_ROW_GAP = 10; // 头部到服务器行之间的间隙
const SERVER_ROW_H = 28; // 卡片内单个服务器行高
const HEADER_BADGE_GAP = 24; // 卡头地图名与右侧徽章之间的最小间距

const ORDER_PILL_H = 22; // 序号徽章 pill 高度
const ORDER_FONT_PT = CANVAS_FONT.size.base; // 序号字号
const ORDER_GAP = 14; // 序号与地图名之间的间距

const FOOTER_H = 40;

// 配色统一取自共享主题
const COLOR_TEXT = CANVAS_COLORS.TEXT;
const COLOR_MUTED = CANVAS_COLORS.TEXT_MUTED;

const TITLE_TEXT = '地图分布';
const TITLE_GAP = 40; // 标题左侧文字与右侧统计之间的最小间距

interface MapEntry {
    map: IMapDataItem;
    order: string; // 已补零的序号文本(如 "01")
    servers: OnlineServerItem[]; // 该地图下的服务器(按玩家数降序), 空数组为空闲地图
    playersTotal: number;
    capacityTotal: number;
}

/**
 * 地图分布画布 — 有序地图卡片列表(顺序优先, 不拆段):
 *   标题 + 按 mapData 原始顺序逐张地图卡片(序号徽章 + 地图名 + 服务器/玩家徽章, 有服务器则展开服务器行) + 页脚
 * 地图顺序是核心: 既不按玩家数重排, 也不把空闲地图拆到别处。
 * 画布宽度 clamp 到 [560, 880]。
 */
export class MapsCanvas extends BaseCanvas {
    serverList: OnlineServerItem[];
    mapData: IMapDataItem[];
    fileName: string;
    mapStartedAtMap: Map<string, number | null>;

    // render params data
    renderWidth = 0;
    renderHeight = 0;

    private entries: MapEntry[] = [];
    private orderPillW = 0; // 序号徽章宽(取最宽序号)

    constructor(
        serverList: OnlineServerItem[],
        mapData: IMapDataItem[],
        fileName: string,
        mapStartedAtMap: Map<string, number | null> = new Map(),
    ) {
        super();
        this.serverList = serverList;
        this.mapData = mapData;
        this.fileName = fileName;
        this.mapStartedAtMap = mapStartedAtMap;
    }

    private serverKey(server: OnlineServerItem): string {
        return `${server.address}:${server.port}`;
    }

    /** 按 mapData 原始顺序构造条目, 仅在地图内部对服务器按玩家数降序 */
    private buildEntries() {
        const serversByMap = new Map<string, OnlineServerItem[]>();
        this.serverList.forEach((s) => {
            const id = getMapShortName(s.map_id);
            const arr = serversByMap.get(id) ?? [];
            arr.push(s);
            serversByMap.set(id, arr);
        });

        const digits = Math.max(2, String(this.mapData.length).length);

        this.entries = this.mapData.map((m, i) => {
            const servers = (serversByMap.get(m.id) ?? []).sort(
                (a, b) => b.current_players - a.current_players,
            );
            return {
                map: m,
                order: String(i + 1).padStart(digits, '0'),
                servers,
                playersTotal: servers.reduce(
                    (acc, s) => acc + s.current_players,
                    0,
                ),
                capacityTotal: servers.reduce(
                    (acc, s) => acc + s.max_players,
                    0,
                ),
            };
        });
    }

    /** 卡头右侧徽章分段(运行中: 服务器数 · 玩家数; 空闲: 空闲) */
    private buildBadgeSegments(entry: MapEntry): TextSegment[] {
        const labelFont = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        const valueFont = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.bold,
            'mono',
        );
        if (entry.servers.length === 0) {
            return [{ text: '空闲', color: COLOR_MUTED, font: labelFont }];
        }
        return [
            {
                text: `${entry.servers.length}`,
                color: COLOR_TEXT,
                font: valueFont,
            },
            { text: ' 服务器  ·  ', color: COLOR_MUTED, font: labelFont },
            {
                text: `${entry.playersTotal}`,
                color: getCountColor(entry.playersTotal, entry.capacityTotal),
                font: valueFont,
            },
            { text: ' 玩家', color: COLOR_MUTED, font: labelFont },
        ];
    }

    /** 卡体单个服务器行分段(服务器名 + 人数 + 时长); 服务器名按可用宽截断(扣除序号缩进) */
    private buildServerRowSegments(
        server: OnlineServerItem,
        ctx: Canvas2DContext,
        indent: number,
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
                    CANVAS_FONT.size.base,
                    CANVAS_FONT.weight.bold,
                    'mono',
                ),
            },
            {
                text: `  ${duration}`,
                color: COLOR_MUTED,
                font: buildCanvasFont(
                    CANVAS_FONT.size.sm,
                    CANVAS_FONT.weight.normal,
                    'sans',
                ),
            },
        ];
        const nameFont = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.bold,
            'sans',
        );
        return buildTruncatedNameSegments(
            ctx,
            server.name,
            tail,
            CANVAS_CARD_CONTENT_MAX_W - indent,
            nameFont,
        );
    }

    /** 标题右侧的概览统计分段 */
    private buildTitleStatSegments(): TextSegment[] {
        const runningCount = this.entries.filter(
            (e) => e.servers.length > 0,
        ).length;
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
                text: `${this.mapData.length}`,
                color: COLOR_TEXT,
                font: valueFont,
            },
            { text: ' 张地图  ·  ', color: COLOR_MUTED, font: labelFont },
            {
                text: `${runningCount}`,
                color: COLOR_TEXT,
                font: valueFont,
            },
            { text: ' 张运行中  ·  ', color: COLOR_MUTED, font: labelFont },
            {
                text: `${this.serverList.length}`,
                color: COLOR_TEXT,
                font: valueFont,
            },
            { text: ' 服务器', color: COLOR_MUTED, font: labelFont },
        ];
    }

    /** 单张地图卡片高度 */
    private cardHeight(entry: MapEntry): number {
        let h = CARD_PAD_Y + HEADER_H + CARD_PAD_Y;
        if (entry.servers.length > 0) {
            h += HEADER_TO_ROW_GAP + entry.servers.length * SERVER_ROW_H;
        }
        return h;
    }

    /**
     * 测量阶段: 构造有序条目、确定序号徽章宽、计算画布宽高。
     */
    private prepare() {
        this.buildEntries();

        const tmp = createCanvas(1, 1);
        const ctx = tmp.getContext('2d');

        // (1) 序号徽章宽(文本 + pill 内边距)
        ctx.font = buildCanvasFont(ORDER_FONT_PT, 'bold', 'mono');
        this.orderPillW = this.entries.reduce(
            (m, e) =>
                Math.max(
                    m,
                    ctx.measureText(e.order).width + CANVAS_SPACE[2] * 2,
                ),
            0,
        );
        const indent = this.orderPillW + ORDER_GAP; // 地图名 / 服务器行的左缩进

        // (2) 卡片内容最大宽(卡头 = 序号 + 地图名 + 间距 + 徽章; 服务器行缩进对齐地图名)
        let cardContentW = 0;
        this.entries.forEach((e) => {
            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.lg,
                CANVAS_FONT.weight.bold,
                'sans',
            );
            const mapNameW = ctx.measureText(getMapTextInCanvas(e.map)).width;
            const badgeW = measureSegmentsWidth(ctx, this.buildBadgeSegments(e));
            const headerW = indent + mapNameW + HEADER_BADGE_GAP + badgeW;
            cardContentW = Math.max(cardContentW, headerW);
            e.servers.forEach((s) => {
                cardContentW = Math.max(
                    cardContentW,
                    indent +
                        measureSegmentsWidth(
                            ctx,
                            this.buildServerRowSegments(s, ctx, indent),
                        ),
                );
            });
        });

        // (3) footer 宽
        this.renderFooter(ctx);
        ctx.font = buildCanvasFont(CANVAS_FONT.size.xs);
        const footerW = this.totalFooter
            ? ctx.measureText(this.totalFooter).width
            : 0;

        // (4) 标题宽
        const titleStatW = measureSegmentsWidth(
            ctx,
            this.buildTitleStatSegments(),
        );
        ctx.font = buildCanvasFont(CANVAS_FONT.size['2xl'], 'bold', 'sans');
        const titleW =
            ctx.measureText(TITLE_TEXT).width + TITLE_GAP + titleStatW;

        // (5) 整图宽高(内容自然宽 clamp)
        const naturalW = Math.max(
            PAD * 2 + titleW,
            PAD * 2 + cardContentW + CARD_PAD_X * 2,
            20 + footerW,
        );
        this.renderWidth = clampCanvasWidth(naturalW);
        this.renderHeight = this.computeHeight();
    }

    private computeHeight(): number {
        let h = PAD + TITLE_H;
        this.entries.forEach((e, i) => {
            h += this.cardHeight(e);
            if (i < this.entries.length - 1) {
                h += CARD_GAP;
            }
        });
        if (this.entries.length > 0) {
            h += SECTION_GAP;
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

    private renderMapCards(ctx: Canvas2DContext, y: number): number {
        const cardX = PAD;
        const cardW = this.renderWidth - PAD * 2;
        const indent = this.orderPillW + ORDER_GAP;

        this.entries.forEach((entry, i) => {
            const cardH = this.cardHeight(entry);
            const isIdle = entry.servers.length === 0;

            // 卡片背景 + 投影(空闲更弱)
            renderCard(ctx, cardX, y, cardW, cardH, {
                fillStyle: isIdle
                    ? CANVAS_COLORS.BG_OVERLAY_WEAK
                    : CANVAS_COLORS.BG_OVERLAY,
            });

            const headerMidY = y + CARD_PAD_Y + HEADER_H / 2;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';

            // 序号徽章(AMBER_500 底色 pill + 深色字, 避免橙色字在暖底上对比不足)
            ctx.font = buildCanvasFont(ORDER_FONT_PT, 'bold', 'mono');
            ctx.fillStyle = CANVAS_COLORS.AMBER_500;
            roundRectPath(
                ctx,
                cardX + CARD_PAD_X,
                headerMidY - ORDER_PILL_H / 2,
                this.orderPillW,
                ORDER_PILL_H,
                ORDER_PILL_H / 2,
            );
            ctx.fill();
            ctx.fillStyle = CANVAS_COLORS.BG;
            ctx.textBaseline = 'middle';
            ctx.fillText(
                entry.order,
                cardX + CARD_PAD_X + CANVAS_SPACE[2],
                headerMidY,
            );

            // 地图名(超宽截断)
            const badgeSegments = this.buildBadgeSegments(entry);
            const badgeW = measureSegmentsWidth(ctx, badgeSegments);
            const nameX = cardX + CARD_PAD_X + indent;
            const nameMaxW =
                cardW - CARD_PAD_X * 2 - indent - badgeW - HEADER_BADGE_GAP;
            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.lg,
                CANVAS_FONT.weight.bold,
                'sans',
            );
            ctx.fillStyle = isIdle ? COLOR_MUTED : COLOR_TEXT;
            ctx.fillText(
                truncate(ctx, getMapTextInCanvas(entry.map), nameMaxW),
                nameX,
                headerMidY,
            );

            // 右侧徽章
            drawSegments(
                ctx,
                cardX + cardW - CARD_PAD_X,
                headerMidY,
                badgeSegments,
                'right',
            );

            // 卡体: 服务器行(缩进对齐地图名)
            let rowY = y + CARD_PAD_Y + HEADER_H + HEADER_TO_ROW_GAP;
            entry.servers.forEach((s) => {
                drawSegments(
                    ctx,
                    nameX,
                    rowY + SERVER_ROW_H / 2,
                    this.buildServerRowSegments(s, ctx, indent),
                    'left',
                );
                rowY += SERVER_ROW_H;
            });

            y += cardH;
            if (i < this.entries.length - 1) {
                y += CARD_GAP;
            }
        });

        if (this.entries.length > 0) {
            y += SECTION_GAP;
        }
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
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
        y = this.renderMapCards(ctx, y);
        return y;
    }
}
