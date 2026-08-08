import { Canvas2DContext } from '../../../services/canvasBackend';
import { BaseCanvas, CanvasSize } from '../../../services/baseCanvas';
import { buildCanvasFont, CANVAS_FONT } from '../../../services/canvasFonts';
import { CANVAS_COLORS, CANVAS_RADIUS, CANVAS_SPACE } from '../../../services/canvasTheme';
import {
    roundRectPath,
    drawSegments,
    truncate,
    drawFitText,
    drawSparklineAxisLabels,
    TextSegment,
} from '../../../services/canvasHelpers';
import {
    CANVAS_MAX_WIDTH,
    renderCard,
    renderKpiCard,
    renderPageTitle,
    renderSectionHeader,
} from '../../../services/canvasLayout';
import {
    HistoricalServerItem,
    IServerOverviewStats,
    ITrendSummary,
} from '../types/types';
import {
    formatMapDuration,
    getCountColor,
    getServerInfoDisplaySectionText,
} from '../utils/utils';

// ============================================================================
// 布局常量(统一走设计 token, 见 src/services/canvasTheme.ts / canvasLayout.ts)
// ============================================================================
const WIDTH = CANVAS_MAX_WIDTH;
const PAD = CANVAS_SPACE[6];
const CONTENT_W = WIDTH - PAD * 2;

const TITLE_H = 56;

const KPI_GAP = CANVAS_SPACE[4];
const KPI_COUNT = 4;
const KPI_CARD_W = (CONTENT_W - KPI_GAP * (KPI_COUNT - 1)) / KPI_COUNT;
const KPI_CARD_H = 96;

const TREND_H = 128;

const SECTION_HEADER_H = 40;
const DETAIL_COL_HEADER_H = 28;
const DETAIL_ROW_H = 34;
const OFFLINE_ROW_H = 28;
const SECTION_GAP = CANVAS_SPACE[4];

const FOOTER_H = 40;

const TITLE_TEXT = '服务器状态总览';

/**
 * 服务器状态总览画布 — 卡片式三段布局(固定 880 宽):
 *   段一 概览: 标题 + KPI 卡片 + 历史峰值趋势条
 *   段二 服务器详情: 各服务器地图 / 玩家 / Bots / 运行时长
 *   段三 页脚
 */
export class ServerOverviewCanvas extends BaseCanvas {
    stats: IServerOverviewStats;
    trend: ITrendSummary;
    mapStartedAtMap: Map<string, number | null>;
    latencyMap: Map<string, number | null>;
    historicalServers: HistoricalServerItem[];
    fileName: string;

    renderHeight = 0;

    constructor(
        stats: IServerOverviewStats,
        trend: ITrendSummary,
        fileName: string,
        mapStartedAtMap: Map<string, number | null> = new Map(),
        latencyMap: Map<string, number | null> = new Map(),
        historicalServers: HistoricalServerItem[] = [],
    ) {
        super();
        this.stats = stats;
        this.trend = trend;
        this.fileName = fileName;
        this.mapStartedAtMap = mapStartedAtMap;
        this.latencyMap = latencyMap;
        this.historicalServers = historicalServers;
    }

    /** 延迟着色: 低绿 / 中琥珀 / 高红 / 无数据灰(语义色) */
    private latencyColor(ms: number | null | undefined): string {
        if (ms === null || ms === undefined) {
            return CANVAS_COLORS.TEXT_MUTED;
        }
        if (ms < 80) {
            return CANVAS_COLORS.SUCCESS;
        }
        if (ms < 180) {
            return CANVAS_COLORS.WARNING;
        }
        return CANVAS_COLORS.DANGER;
    }

    private hasTrendStrip(): boolean {
        return (
            this.trend.series24h.length > 0 ||
            this.trend.peak24h !== null ||
            this.trend.peak7d !== null
        );
    }

    /** 计算画布总高度 */
    private computeHeight(): number {
        let h = PAD + TITLE_H + KPI_CARD_H + SECTION_GAP;

        if (this.hasTrendStrip()) {
            h += TREND_H + SECTION_GAP;
        }

        if (this.stats.serverDetail.length > 0) {
            h +=
                SECTION_HEADER_H +
                DETAIL_COL_HEADER_H +
                this.stats.serverDetail.length * DETAIL_ROW_H +
                SECTION_GAP;
        }

        if (this.historicalServers.length > 0) {
            h +=
                SECTION_HEADER_H +
                this.historicalServers.length * OFFLINE_ROW_H +
                SECTION_GAP;
        }

        h += FOOTER_H;
        return h;
    }

    // ------------------------------------------------------------------
    // 段一: 概览(标题 + KPI 卡片 + 趋势条)
    // ------------------------------------------------------------------
    private renderTitle(ctx: Canvas2DContext, y: number): number {
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
        return renderPageTitle(
            ctx,
            PAD,
            y,
            TITLE_TEXT,
            [
                { text: `${this.stats.serverCount}`, color: CANVAS_COLORS.TEXT, font: valueFont },
                { text: ' 服务器  ·  ', color: CANVAS_COLORS.TEXT_MUTED, font: labelFont },
                {
                    text: `${this.stats.playersTotal}`,
                    color: getCountColor(
                        this.stats.playersTotal,
                        this.stats.capacityTotal,
                    ),
                    font: valueFont,
                },
                { text: ' 玩家在线', color: CANVAS_COLORS.TEXT_MUTED, font: labelFont },
            ],
            { rightX: WIDTH - PAD },
        );
    }

    private renderKpiRow(ctx: Canvas2DContext, y: number): number {
        const occupancyPct = `${Math.round(this.stats.occupancyRate * 100)}%`;
        const playersColor = getCountColor(
            this.stats.playersTotal,
            this.stats.capacityTotal,
        );

        const kpis = [
            {
                label: '在线服务器',
                value: `${this.stats.serverCount}`,
                valueColor: CANVAS_COLORS.TEXT,
                sub: `满 ${this.stats.fullCount} · 空 ${this.stats.emptyCount}`,
            },
            {
                label: '在线玩家 / 容量',
                value: `${this.stats.playersTotal}/${this.stats.capacityTotal}`,
                valueColor: playersColor,
                sub: `占用 ${occupancyPct}`,
            },
            {
                label: 'AI 单位 (Bots)',
                value: `${this.stats.botsTotal}`,
                valueColor: CANVAS_COLORS.TEXT,
                sub: '',
            },
            {
                label: '满员服务器',
                value: `${this.stats.fullCount}`,
                valueColor:
                    this.stats.fullCount > 0
                        ? CANVAS_COLORS.AMBER_500
                        : CANVAS_COLORS.TEXT,
                sub: `空闲 ${this.stats.emptyCount}`,
            },
        ];

        kpis.forEach((kpi, idx) => {
            renderKpiCard(ctx, {
                x: PAD + idx * (KPI_CARD_W + KPI_GAP),
                y,
                w: KPI_CARD_W,
                h: KPI_CARD_H,
                label: kpi.label,
                value: kpi.value,
                valueColor: kpi.valueColor,
                sub: kpi.sub,
            });
        });

        return y + KPI_CARD_H + SECTION_GAP;
    }

    private renderTrendStrip(ctx: Canvas2DContext, y: number): number {
        if (!this.hasTrendStrip()) {
            return y;
        }

        const cardH = TREND_H - 12;
        renderCard(ctx, PAD, y, CONTENT_W, cardH, { radius: CANVAS_RADIUS.md });

        const innerX = PAD + CANVAS_SPACE[4];

        // 标题行: 左侧标题 + 右侧峰值数字
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.bold,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.TEXT;
        ctx.fillText('在线趋势 · 近24小时', innerX, y + 12);

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
        const peakSegments: TextSegment[] = [];
        if (this.trend.peak24h !== null) {
            peakSegments.push(
                { text: '24h峰值 ', color: CANVAS_COLORS.TEXT_MUTED, font: labelFont },
                { text: `${this.trend.peak24h}人`, color: CANVAS_COLORS.VALUE, font: valueFont },
            );
        }
        if (peakSegments.length > 0) {
            drawSegments(
                ctx,
                WIDTH - PAD - CANVAS_SPACE[4],
                y + 12,
                peakSegments,
                'right',
            );
        }

        // 折线图区域
        this.renderTrendSparkline(
            ctx,
            innerX,
            y + 38,
            CONTENT_W - CANVAS_SPACE[8],
            cardH - 38 - 12,
        );

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        return y + TREND_H + SECTION_GAP;
    }

    /** 在指定区域绘制近24小时在线数面积折线图 */
    private renderTrendSparkline(
        ctx: Canvas2DContext,
        x: number,
        y: number,
        w: number,
        h: number,
    ) {
        const series = this.trend.series24h;
        const labelH = 16; // 底部小时刻度
        const chartTop = y;
        const baseline = y + h - labelH;
        const chartH = baseline - chartTop;

        if (series.length === 0) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.sm,
                CANVAS_FONT.weight.normal,
                'sans',
            );
            ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
            ctx.fillText('暂无趋势数据', x + w / 2, chartTop + chartH / 2);
            return;
        }

        const maxCount = Math.max(1, ...series.map((d) => d.count));
        const n = series.length;
        const points = series.map((d, i) => {
            const px = n === 1 ? x + w / 2 : x + (i / (n - 1)) * w;
            const py = baseline - (d.count / maxCount) * chartH;
            return { x: px, y: py, count: d.count, date: d.date };
        });

        // 基线
        ctx.strokeStyle = CANVAS_COLORS.LINE_WEAK;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, baseline);
        ctx.lineTo(x + w, baseline);
        ctx.stroke();

        // 面积填充
        ctx.beginPath();
        points.forEach((p, i) =>
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
        );
        ctx.lineTo(points[n - 1].x, baseline);
        ctx.lineTo(points[0].x, baseline);
        ctx.closePath();
        ctx.fillStyle = CANVAS_COLORS.AREA_ACCENT;
        ctx.fill();

        // 折线
        ctx.beginPath();
        points.forEach((p, i) =>
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
        );
        ctx.strokeStyle = CANVAS_COLORS.AMBER_500;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 峰值点高亮
        let peakIdx = 0;
        points.forEach((p, i) => {
            if (p.count > points[peakIdx].count) {
                peakIdx = i;
            }
        });
        const peak = points[peakIdx];
        ctx.beginPath();
        ctx.arc(peak.x, peak.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = CANVAS_COLORS.VALUE;
        ctx.fill();

        // 小时刻度(首 / 峰值 / 尾) —— 峰值标签做像素级防重叠
        ctx.textBaseline = 'middle';
        const labelY = baseline + labelH / 2 + 1;
        drawSparklineAxisLabels(ctx, {
            x,
            w,
            labelY,
            startLabel: series[0].date,
            endLabel: series[n - 1].date,
            peakLabel: peakIdx > 0 && peakIdx < n - 1 ? peak.date : null,
            peakX: peak.x,
            mutedColor: CANVAS_COLORS.TEXT_MUTED,
            peakColor: CANVAS_COLORS.VALUE,
            font: buildCanvasFont(
                CANVAS_FONT.size.xs,
                CANVAS_FONT.weight.normal,
                'mono',
            ),
        });

        ctx.textBaseline = 'top';
    }

    // ------------------------------------------------------------------
    // 段二: 服务器详情(地图 / 玩家 / Bots / 运行时长)
    // ------------------------------------------------------------------
    private renderServerDetail(ctx: Canvas2DContext, y: number): number {
        if (this.stats.serverDetail.length === 0) {
            return y;
        }

        y = renderSectionHeader(ctx, y, '服务器详情', '', {
            x: PAD,
            rightX: WIDTH - PAD,
        });

        const nameX = PAD;
        const mapX = PAD + 250;
        const playersRight = PAD + 470;
        const botsRight = PAD + 575;
        const latencyRight = PAD + 700;
        const durationRight = WIDTH - PAD;

        // 列标题(用暖中性色, 降低侵略性)
        ctx.textBaseline = 'middle';
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.bold,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.WARM_300;
        const headMidY = y + DETAIL_COL_HEADER_H / 2;
        ctx.textAlign = 'left';
        ctx.fillText('服务器', nameX, headMidY);
        ctx.fillText('地图', mapX, headMidY);
        ctx.textAlign = 'right';
        ctx.fillText('玩家', playersRight, headMidY);
        ctx.fillText('Bots', botsRight, headMidY);
        ctx.fillText('延迟', latencyRight, headMidY);
        ctx.fillText('地图时长', durationRight, headMidY);

        const bodyY = y + DETAIL_COL_HEADER_H;

        this.stats.serverDetail.forEach((d, i) => {
            const rowY = bodyY + i * DETAIL_ROW_H;
            const midY = rowY + DETAIL_ROW_H / 2;

            // 斑马纹行底色(统一弱覆盖)
            if (i % 2 === 0) {
                ctx.fillStyle = CANVAS_COLORS.BG_OVERLAY_WEAK;
                roundRectPath(
                    ctx,
                    PAD - 8,
                    rowY + 2,
                    CONTENT_W + 16,
                    DETAIL_ROW_H - 4,
                    CANVAS_RADIUS.sm,
                );
                ctx.fill();
            }

            ctx.textBaseline = 'middle';

            // 服务器名称保持全名, 字号自适应(禁止截断/换行)
            drawFitText(
                ctx,
                d.name,
                nameX,
                midY,
                mapX - nameX - 14,
                13,
                9,
                CANVAS_COLORS.TEXT,
                'left',
            );

            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.sm,
                CANVAS_FONT.weight.normal,
                'sans',
            );
            ctx.fillStyle = CANVAS_COLORS.AMBER_500;
            ctx.fillText(
                truncate(ctx, d.mapName, playersRight - mapX - 60),
                mapX,
                midY,
            );

            ctx.textAlign = 'right';
            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.base,
                CANVAS_FONT.weight.bold,
                'mono',
            );
            ctx.fillStyle = getCountColor(d.players, d.maxPlayers);
            ctx.fillText(`${d.players}/${d.maxPlayers}`, playersRight, midY);

            ctx.fillStyle = d.bots > 0 ? CANVAS_COLORS.INFO : CANVAS_COLORS.TEXT_MUTED;
            ctx.fillText(`${d.bots}`, botsRight, midY);

            // 延迟
            const latency = this.latencyMap.get(d.serverKey);
            const latencyText =
                latency === null || latency === undefined
                    ? '超时'
                    : `${latency}ms`;
            ctx.fillStyle = this.latencyColor(latency);
            ctx.fillText(latencyText, latencyRight, midY);

            const durationText = formatMapDuration(
                this.mapStartedAtMap.get(d.serverKey) ?? null,
            );
            ctx.fillStyle = CANVAS_COLORS.INFO;
            ctx.fillText(durationText, durationRight, midY);
        });

        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        return (
            bodyY + this.stats.serverDetail.length * DETAIL_ROW_H + SECTION_GAP
        );
    }

    // ------------------------------------------------------------------
    // 段二补充: 近期离线服务器(弱化展示)
    // ------------------------------------------------------------------
    private renderOfflineSection(ctx: Canvas2DContext, y: number): number {
        if (this.historicalServers.length === 0) {
            return y;
        }

        y = renderSectionHeader(ctx, y, '近5分钟离线服务器', '', {
            x: PAD,
            rightX: WIDTH - PAD,
        });

        const nameX = PAD;
        const mapX = PAD + 250;
        const playersRight = PAD + 470;
        const elapsedRight = WIDTH - PAD;

        ctx.textBaseline = 'middle';

        this.historicalServers.forEach((s, i) => {
            const rowY = y + i * OFFLINE_ROW_H;
            const midY = rowY + OFFLINE_ROW_H / 2;
            const sec = getServerInfoDisplaySectionText(s);

            ctx.textAlign = 'left';
            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.sm,
                CANVAS_FONT.weight.normal,
                'sans',
            );
            ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
            ctx.fillText(
                truncate(ctx, s.name, mapX - nameX - 14),
                nameX,
                midY,
            );

            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.xs,
                CANVAS_FONT.weight.normal,
                'sans',
            );
            ctx.fillStyle = CANVAS_COLORS.MUTED_DIM;
            ctx.fillText(
                truncate(ctx, sec.mapSection.trim(), playersRight - mapX - 20),
                mapX,
                midY,
            );

            ctx.textAlign = 'right';
            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.sm,
                CANVAS_FONT.weight.normal,
                'sans',
            );
            ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
            ctx.fillText(sec.playersSection, playersRight, midY);

            const elapsedMin = Math.ceil((Date.now() - s.lastSeenAt) / 60000);
            ctx.fillStyle = CANVAS_COLORS.MUTED_DIMMER;
            ctx.fillText(`${elapsedMin}分钟前`, elapsedRight, midY);
        });

        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        return y + this.historicalServers.length * OFFLINE_ROW_H + SECTION_GAP;
    }

    protected measure(): CanvasSize {
        this.renderHeight = this.computeHeight();
        return { width: WIDTH, height: this.renderHeight };
    }

    protected getFileName(): string {
        return this.fileName;
    }

    protected getBgColor(): string {
        return CANVAS_COLORS.BG;
    }

    protected paint(ctx: Canvas2DContext): number {
        // 段一 概览
        let y = PAD;
        y = this.renderTitle(ctx, y);
        y = this.renderKpiRow(ctx, y);
        y = this.renderTrendStrip(ctx, y);

        // 段二 服务器详情
        y = this.renderServerDetail(ctx, y);
        y = this.renderOfflineSection(ctx, y);

        return y;
    }
}
