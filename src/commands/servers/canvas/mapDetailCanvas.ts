import { Canvas2DContext } from '../../../services/canvasBackend';
import { IMapDataItem, OnlineServerItem } from '../types/types';
import { getCountColor, formatMapDuration } from '../utils/utils';
import { BaseCanvas, CanvasSize } from '../../../services/baseCanvas';
import { buildCanvasFont, CANVAS_FONT } from '../../../services/canvasFonts';
import {
    roundRectPath,
    drawSegments,
    truncate,
    TextSegment,
} from '../../../services/canvasHelpers';
import { CANVAS_COLORS, CANVAS_SPACE } from '../../../services/canvasTheme';
import {
    CANVAS_CARD_CONTENT_MAX_W,
    CANVAS_MAX_WIDTH,
    buildTruncatedNameSegments,
    renderCard,
    renderEmptyCard,
    renderKpiCard,
} from '../../../services/canvasLayout';

// ============================================================================
// 布局常量(统一走设计 token, 见 src/services/canvasTheme.ts / canvasLayout.ts)
// ============================================================================
const PAD = CANVAS_SPACE[6];
const TITLE_H = 64;
const SECTION_GAP = CANVAS_SPACE[4];

const KPI_GAP = CANVAS_SPACE[4];
const KPI_COUNT = 3;
const KPI_CARD_H = 96;

const CARD_GAP = CANVAS_SPACE[3]; // 服务器卡片之间的垂直间距 12
const CARD_PAD_X = CANVAS_SPACE[4];
const SERVER_CARD_H = 48; // 单个服务器卡片高度
const EMPTY_CARD_H = 64; // 空状态占位卡片高度

const STATUS_PILL_GAP = 12; // 状态 pill 与相邻文本的间距
const STATUS_PILL_PAD_X = 10; // 状态 pill 左右内边距
const STATUS_PILL_H = 22; // 状态 pill 高度

const FOOTER_H = 40;

// 固定宽度(与 overview/analytics 对齐)
const WIDTH = CANVAS_MAX_WIDTH;
const CONTENT_W = WIDTH - PAD * 2;

// 配色统一取自共享主题
const COLOR_TEXT = CANVAS_COLORS.TEXT;
const COLOR_MUTED = CANVAS_COLORS.TEXT_MUTED;

const EMPTY_TEXT = '当前没有服务器正在运行此地图';

interface KpiItem {
    label: string;
    value: string;
    valueColor: string;
    sub: string;
}

/**
 * 地图详情画布 — 三段式布局(与 overview 设计语言一致):
 *   标题英雄区(地图名 + id) + KPI 卡片行(运行服务器/在线玩家/满员) + 服务器详情卡片列表 + 页脚
 * 画布宽度固定 880。
 */
export class MapDetailCanvas extends BaseCanvas {
    map: IMapDataItem;
    servers: OnlineServerItem[];
    fileName: string;
    mapStartedAtMap: Map<string, number | null>;

    renderWidth = 0;
    renderHeight = 0;

    constructor(
        map: IMapDataItem,
        servers: OnlineServerItem[],
        fileName: string,
        mapStartedAtMap: Map<string, number | null> = new Map(),
    ) {
        super();
        this.map = map;
        this.servers = servers;
        this.fileName = fileName;
        this.mapStartedAtMap = mapStartedAtMap;
    }

    private serverKey(server: OnlineServerItem): string {
        return `${server.address}:${server.port}`;
    }

    private fullCount(): number {
        return this.servers.filter(
            (s) => s.current_players >= s.max_players,
        ).length;
    }

    private buildKpis(): KpiItem[] {
        const playersTotal = this.servers.reduce(
            (acc, s) => acc + s.current_players,
            0,
        );
        const capacityTotal = this.servers.reduce(
            (acc, s) => acc + s.max_players,
            0,
        );
        const fullCount = this.fullCount();
        return [
            {
                label: '运行服务器',
                value: `${this.servers.length}`,
                valueColor: COLOR_TEXT,
                sub: '',
            },
            {
                label: '在线玩家 / 容量',
                value: `${playersTotal}/${capacityTotal}`,
                valueColor: getCountColor(playersTotal, capacityTotal),
                sub: '',
            },
            {
                label: '满员服务器',
                value: `${fullCount}`,
                valueColor: fullCount > 0 ? CANVAS_COLORS.AMBER_500 : COLOR_TEXT,
                sub: '',
            },
        ];
    }

    /** 服务器卡片的文本分段(服务器名 + 人数 + 时长); 服务器名按可用宽截断(给状态 pill 预留) */
    private buildServerSegments(
        server: OnlineServerItem,
        ctx: Canvas2DContext,
    ): TextSegment[] {
        const duration = formatMapDuration(
            this.mapStartedAtMap.get(this.serverKey(server)) ?? null,
        );
        const tail: TextSegment[] = [
            {
                text: `  ${server.current_players}/${server.max_players}`,
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
                text: `  ${duration}`,
                color: COLOR_MUTED,
                font: buildCanvasFont(
                    CANVAS_FONT.size.sm,
                    CANVAS_FONT.weight.normal,
                    'sans',
                ),
            },
        ];

        const statusFont = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.bold,
            'sans',
        );
        ctx.font = statusFont;
        const statusPillW =
            ctx.measureText(this.statusText(server)).width +
            STATUS_PILL_PAD_X * 2;

        const nameFont = buildCanvasFont(
            CANVAS_FONT.size.lg,
            CANVAS_FONT.weight.bold,
            'sans',
        );
        return buildTruncatedNameSegments(
            ctx,
            server.name,
            tail,
            CANVAS_CARD_CONTENT_MAX_W - statusPillW - STATUS_PILL_GAP,
            nameFont,
        );
    }

    private isFull(server: OnlineServerItem): boolean {
        return server.current_players >= server.max_players;
    }

    private statusText(server: OnlineServerItem): string {
        return this.isFull(server) ? '已满' : '在线';
    }

    private statusColor(server: OnlineServerItem): string {
        return this.isFull(server)
            ? CANVAS_COLORS.DANGER
            : CANVAS_COLORS.SUCCESS;
    }

    /** 状态 pill(颜色 + 文字同时出现), 右对齐绘制, 返回下一个可用的右侧 x */
    private renderStatusPill(
        ctx: Canvas2DContext,
        rightX: number,
        midY: number,
        server: OnlineServerItem,
    ): number {
        const status = this.statusText(server);
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.bold,
            'sans',
        );
        const pillW = ctx.measureText(status).width + STATUS_PILL_PAD_X * 2;

        ctx.fillStyle = this.statusColor(server);
        ctx.save();
        ctx.globalAlpha = 0.16;
        roundRectPath(
            ctx,
            rightX - pillW,
            midY - STATUS_PILL_H / 2,
            pillW,
            STATUS_PILL_H,
            STATUS_PILL_H / 2,
        );
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = this.statusColor(server);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            status,
            rightX - pillW + STATUS_PILL_PAD_X,
            midY,
        );

        return rightX - pillW - STATUS_PILL_GAP;
    }

    private prepare() {
        this.renderWidth = WIDTH;
        this.renderHeight = this.computeHeight();
    }

    private computeHeight(): number {
        let h = PAD + TITLE_H + KPI_CARD_H + SECTION_GAP;

        if (this.servers.length === 0) {
            h += EMPTY_CARD_H;
        } else {
            this.servers.forEach((_s, i) => {
                h += SERVER_CARD_H;
                if (i < this.servers.length - 1) {
                    h += CARD_GAP;
                }
            });
        }

        h += SECTION_GAP + FOOTER_H;
        return Math.ceil(h);
    }

    private renderTitle(ctx: Canvas2DContext, y: number): number {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        ctx.fillStyle = COLOR_MUTED;
        ctx.fillText('地图详情', PAD, y);

        // 地图名(2xl) + id(弱化)
        const nameY = y + 24;
        ctx.textBaseline = 'middle';
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size['2xl'],
            CANVAS_FONT.weight.bold,
            'sans',
        );
        ctx.fillStyle = COLOR_TEXT;
        const name = truncate(ctx, this.map.name, CONTENT_W - 120);
        ctx.fillText(name, PAD, nameY + 8);
        const nameW = ctx.measureText(name).width;

        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        ctx.fillStyle = COLOR_MUTED;
        ctx.fillText(` (${this.map.id})`, PAD + nameW + 4, nameY + 10);

        ctx.textBaseline = 'top';
        return y + TITLE_H;
    }

    private renderKpiRow(ctx: Canvas2DContext, y: number): number {
        const kpis = this.buildKpis();
        const contentW = this.renderWidth - PAD * 2;
        const cardW = (contentW - KPI_GAP * (KPI_COUNT - 1)) / KPI_COUNT;

        kpis.forEach((kpi, idx) => {
            const x = PAD + idx * (cardW + KPI_GAP);
            renderKpiCard(ctx, {
                x,
                y,
                w: cardW,
                h: KPI_CARD_H,
                label: kpi.label,
                value: kpi.value,
                valueColor: kpi.valueColor,
                sub: kpi.sub,
            });
        });

        return y + KPI_CARD_H + SECTION_GAP;
    }

    private renderServerList(ctx: Canvas2DContext, y: number): number {
        const cardX = PAD;
        const cardW = this.renderWidth - PAD * 2;

        if (this.servers.length === 0) {
            renderEmptyCard(ctx, cardX, y, cardW, EMPTY_CARD_H, EMPTY_TEXT);
            return y + EMPTY_CARD_H + SECTION_GAP;
        }

        this.servers.forEach((server, i) => {
            renderCard(ctx, cardX, y, cardW, SERVER_CARD_H);

            ctx.textBaseline = 'middle';
            drawSegments(
                ctx,
                cardX + CARD_PAD_X,
                y + SERVER_CARD_H / 2,
                this.buildServerSegments(server, ctx),
                'left',
            );

            // 状态 pill 右对齐
            this.renderStatusPill(
                ctx,
                cardX + cardW - CARD_PAD_X,
                y + SERVER_CARD_H / 2,
                server,
            );

            y += SERVER_CARD_H;
            if (i < this.servers.length - 1) {
                y += CARD_GAP;
            }
        });

        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        return y + SECTION_GAP;
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
        y = this.renderKpiRow(ctx, y);
        y = this.renderServerList(ctx, y);
        return y;
    }
}
