import dayjs from 'dayjs';
import { Canvas2DContext } from '../../../services/canvasBackend';
import { BaseCanvas, CanvasSize } from '../../../services/baseCanvas';
import { buildCanvasFont, CANVAS_FONT } from '../../../services/canvasFonts';
import {
    roundRectPath,
    drawSegments,
    drawFitText,
    drawSparklineAxisLabels,
    TextSegment,
} from '../../../services/canvasHelpers';
import {
    CANVAS_COLORS,
    CANVAS_RADIUS,
    CANVAS_SPACE,
} from '../../../services/canvasTheme';
import {
    CANVAS_MAX_WIDTH,
    renderCard,
    renderKpiCard,
    renderPageTitle,
    renderSectionHeader,
} from '../../../services/canvasLayout';
import {
    IAnalysisData,
    IAnalyticsViewData,
    IServerAnalyticsSummary,
} from '../types/types';
import { getCountColor } from '../utils/utils';

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

const TREND_GAP = CANVAS_SPACE[4];
const TREND_CARD_W = (CONTENT_W - TREND_GAP) / 2;
const TREND_H = 132;

const SECTION_HEADER_H = 40;
const SECTION_GAP = CANVAS_SPACE[4];

const RANK_ROW_H = 30;
const RANK_MAX = 15;

const GRID_GAP = CANVAS_SPACE[4];
const GRID_COLS = 2;
const GRID_CARD_W = (CONTENT_W - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
const GRID_CARD_H = 140;
const GRID_MAX = 10;

const EMPTY_HINT_H = 30;

const FOOTER_H = 40;

const TITLE_TEXT = '服务器统计总览';

/**
 * 服务器统计总览画布 — 卡片式多段布局(固定 880 宽):
 *   段一 KPI 概要: 24h峰值 / 7日峰值 / 当前在线 / 活跃服务器
 *   段二 全局历史趋势: 近24小时 + 近7日 双 sparkline
 *   段三 服务器活跃排行: 按峰值降序的横向条形
 *   段四 各服务器24h趋势: 2 列卡片(迷你 sparkline + 峰值/当前/均值)
 *   段五 页脚
 */
export class AnalyticsCanvas extends BaseCanvas {
    view: IAnalyticsViewData;
    fileName: string;

    renderHeight = 0;

    constructor(view: IAnalyticsViewData, fileName: string) {
        super();
        this.view = view;
        this.fileName = fileName;
    }

    private shownServers(): IServerAnalyticsSummary[] {
        return this.view.servers.slice(0, GRID_MAX);
    }

    private computeHeight(): number {
        let h = PAD + TITLE_H + KPI_CARD_H + SECTION_GAP;

        // 趋势段恒展示(无数据时卡片内显示占位文案)
        h += SECTION_HEADER_H + TREND_H + SECTION_GAP;

        // 活跃排行段
        h += SECTION_HEADER_H;
        if (this.view.servers.length > 0) {
            const rankRows = Math.min(this.view.servers.length, RANK_MAX);
            h += rankRows * RANK_ROW_H + SECTION_GAP;
        } else {
            h += EMPTY_HINT_H + SECTION_GAP;
        }

        // 各服务器趋势卡片段(24h + 近7日 两段并列)
        const gridSectionH = (): number => {
            let sh = SECTION_HEADER_H;
            if (this.view.servers.length > 0) {
                const shown = this.shownServers().length;
                const rows = Math.ceil(shown / GRID_COLS);
                sh += rows * GRID_CARD_H + (rows - 1) * GRID_GAP + SECTION_GAP;
            } else {
                sh += EMPTY_HINT_H + SECTION_GAP;
            }
            return sh;
        };
        h += gridSectionH() * 2;

        h += FOOTER_H;
        return h;
    }

    // ------------------------------------------------------------------
    // 通用绘制辅助
    // ------------------------------------------------------------------
    private kpiValue(v: number | null): string {
        return v === null || v === undefined ? '—' : `${v}`;
    }

    private renderEmptyHint(ctx: Canvas2DContext, y: number, text: string): number {
        renderCard(ctx, PAD, y, CONTENT_W, EMPTY_HINT_H, {
            radius: CANVAS_RADIUS.sm,
        });

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
        ctx.fillText(text, WIDTH / 2, y + EMPTY_HINT_H / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        return y + EMPTY_HINT_H + SECTION_GAP;
    }

    /**
     * 在指定矩形内绘制面积折线 sparkline。
     * showLabels 为 true 时绘制首/尾/峰值刻度(用于大趋势卡)。
     */
    private drawSparkline(
        ctx: Canvas2DContext,
        x: number,
        y: number,
        w: number,
        h: number,
        series: IAnalysisData[],
        showLabels: boolean,
    ) {
        const labelH = showLabels ? 16 : 0;
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
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
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

        if (!showLabels) {
            return;
        }

        // 刻度(首 / 峰值 / 尾) —— 峰值标签做像素级防重叠
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
    // 段一: 标题 + KPI
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
        const updatedText = this.view.lastUpdateTime
            ? `更新于 ${dayjs(this.view.lastUpdateTime).format('HH:mm')}`
            : '暂无采集数据';
        return renderPageTitle(
            ctx,
            PAD,
            y,
            TITLE_TEXT,
            [
                {
                    text: `${this.view.servers.length}`,
                    color: CANVAS_COLORS.TEXT,
                    font: valueFont,
                },
                { text: ' 服务器  ·  ', color: CANVAS_COLORS.TEXT_MUTED, font: labelFont },
                { text: updatedText, color: CANVAS_COLORS.TEXT_MUTED, font: labelFont },
            ],
            { rightX: WIDTH - PAD },
        );
    }

    private renderKpiRow(ctx: Canvas2DContext, y: number): number {
        const { trend } = this.view;

        const kpis = [
            {
                label: '24小时峰值',
                value: this.kpiValue(trend.peak24h),
                valueColor: CANVAS_COLORS.VALUE,
                sub: '近24h在线最高',
            },
            {
                label: '7日峰值',
                value: this.kpiValue(trend.peak7d),
                valueColor: CANVAS_COLORS.VALUE,
                sub: '近7日在线最高',
            },
            {
                label: '当前在线',
                value: this.kpiValue(trend.latest),
                valueColor:
                    trend.latest !== null
                        ? CANVAS_COLORS.AMBER_500
                        : CANVAS_COLORS.TEXT,
                sub: '最近一次采集',
            },
            {
                label: '活跃服务器',
                value: `${this.view.activeCount}`,
                valueColor: CANVAS_COLORS.TEXT,
                sub: `共 ${this.view.servers.length} 个`,
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

    /** 取序列中峰值(最大 count)点的桶标签(24h 为「H时」, 7日 为「M/D」) */
    private peakDateOf(series: IAnalysisData[]): string | null {
        if (series.length === 0) {
            return null;
        }
        let peak = series[0];
        for (const d of series) {
            if (d.count > peak.count) {
                peak = d;
            }
        }
        return peak.date;
    }

    // ------------------------------------------------------------------
    // 段二: 全局历史趋势(双 sparkline)
    // ------------------------------------------------------------------
    private renderTrendCard(
        ctx: Canvas2DContext,
        x: number,
        y: number,
        title: string,
        peakLabel: string,
        peak: number | null,
        series: IAnalysisData[],
        peakTimeText = '',
    ) {
        const cardH = TREND_H;
        renderCard(ctx, x, y, TREND_CARD_W, cardH, { radius: CANVAS_RADIUS.md });

        const innerX = x + CANVAS_SPACE[4];

        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.base,
            CANVAS_FONT.weight.bold,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.TEXT;
        ctx.fillText(title, innerX, y + 12);

        if (peak !== null) {
            const segments: TextSegment[] = [
                {
                    text: `${peakLabel} `,
                    color: CANVAS_COLORS.TEXT_MUTED,
                    font: buildCanvasFont(
                        CANVAS_FONT.size.sm,
                        CANVAS_FONT.weight.normal,
                        'sans',
                    ),
                },
                {
                    text: `${peak}人`,
                    color: CANVAS_COLORS.VALUE,
                    font: buildCanvasFont(
                        CANVAS_FONT.size.base,
                        CANVAS_FONT.weight.bold,
                        'mono',
                    ),
                },
            ];
            if (peakTimeText) {
                segments.push({
                    text: ` @${peakTimeText}`,
                    color: CANVAS_COLORS.TEXT_MUTED,
                    font: buildCanvasFont(
                        CANVAS_FONT.size.sm,
                        CANVAS_FONT.weight.normal,
                        'sans',
                    ),
                });
            }
            drawSegments(ctx, x + TREND_CARD_W - CANVAS_SPACE[4], y + 12, segments, 'right');
        }

        this.drawSparkline(
            ctx,
            innerX,
            y + 38,
            TREND_CARD_W - CANVAS_SPACE[8],
            cardH - 38 - 12,
            series,
            true,
        );

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
    }

    private renderTrendRow(ctx: Canvas2DContext, y: number): number {
        y = renderSectionHeader(ctx, y, '全局在线趋势', '', {
            x: PAD,
            rightX: WIDTH - PAD,
        });

        const { trend, series7d } = this.view;
        this.renderTrendCard(
            ctx,
            PAD,
            y,
            '近24小时',
            '峰值',
            trend.peak24h,
            trend.series24h,
            this.peakDateOf(trend.series24h) ?? '',
        );
        this.renderTrendCard(
            ctx,
            PAD + TREND_CARD_W + TREND_GAP,
            y,
            '近7日',
            '峰值',
            trend.peak7d,
            series7d,
            this.peakDateOf(series7d) ?? '',
        );

        return y + TREND_H + SECTION_GAP;
    }

    // ------------------------------------------------------------------
    // 段三: 服务器活跃排行
    // ------------------------------------------------------------------
    private renderRankingSection(ctx: Canvas2DContext, y: number): number {
        const total = this.view.servers.length;
        const shown = Math.min(total, RANK_MAX);
        const note = total > shown ? `其余 ${total - shown} 个未展示` : '';

        y = renderSectionHeader(ctx, y, '服务器活跃排行', note, {
            x: PAD,
            rightX: WIDTH - PAD,
        });

        if (total === 0) {
            return this.renderEmptyHint(
                ctx,
                y,
                '暂无各服务器统计数据(请等待采集任务写入)',
            );
        }

        const rankX = PAD;
        const nameX = PAD + 32;
        const nameMaxW = 226;
        const barX = PAD + 272;
        const valueRight = WIDTH - PAD;
        const barMaxW = valueRight - 46 - barX;

        const maxPeak = Math.max(
            1,
            ...this.view.servers.slice(0, shown).map((s) => s.peak),
        );

        this.view.servers.slice(0, shown).forEach((s, i) => {
            const rowY = y + i * RANK_ROW_H;
            const midY = rowY + RANK_ROW_H / 2;

            ctx.textBaseline = 'middle';

            // 名次
            ctx.textAlign = 'left';
            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.sm,
                CANVAS_FONT.weight.bold,
                'mono',
            );
            ctx.fillStyle = i < 3 ? CANVAS_COLORS.VALUE : CANVAS_COLORS.TEXT_MUTED;
            ctx.fillText(`${i + 1}`, rankX, midY);

            // 服务器名
            drawFitText(
                ctx,
                s.serverName,
                nameX,
                midY,
                nameMaxW,
                12,
                9,
                CANVAS_COLORS.TEXT,
                'left',
                'sans',
            );

            // 峰值条(轨道弱覆盖 + AMBER 填充)
            const barH = 10;
            const barY = midY - barH / 2;
            ctx.fillStyle = CANVAS_COLORS.BG_OVERLAY_WEAK;
            roundRectPath(ctx, barX, barY, barMaxW, barH, barH / 2);
            ctx.fill();

            const fillW = Math.max(2, (s.peak / maxPeak) * barMaxW);
            ctx.fillStyle = CANVAS_COLORS.AMBER_500;
            roundRectPath(ctx, barX, barY, fillW, barH, barH / 2);
            ctx.fill();

            // 峰值数字
            ctx.textAlign = 'right';
            ctx.font = buildCanvasFont(
                CANVAS_FONT.size.sm,
                CANVAS_FONT.weight.bold,
                'mono',
            );
            ctx.fillStyle = CANVAS_COLORS.VALUE;
            ctx.fillText(`${s.peak}`, valueRight, midY);
        });

        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        return y + shown * RANK_ROW_H + SECTION_GAP;
    }

    // ------------------------------------------------------------------
    // 段四 / 段五: 各服务器趋势卡片(2 列网格), 24h 与 近7日 各占一段
    // ------------------------------------------------------------------
    private renderServerGridSection(
        ctx: Canvas2DContext,
        y: number,
        title: string,
        mode: '24h' | '7d',
    ): number {
        const total = this.view.servers.length;
        const shown = this.shownServers();
        const note = total > shown.length ? `其余 ${total - shown.length} 个已隐藏` : '';

        y = renderSectionHeader(ctx, y, title, note, {
            x: PAD,
            rightX: WIDTH - PAD,
        });

        if (total === 0) {
            return this.renderEmptyHint(
                ctx,
                y,
                '暂无各服务器统计数据(请等待采集任务写入)',
            );
        }

        shown.forEach((s, i) => {
            const col = i % GRID_COLS;
            const row = Math.floor(i / GRID_COLS);
            const x = PAD + col * (GRID_CARD_W + GRID_GAP);
            const cardY = y + row * (GRID_CARD_H + GRID_GAP);

            this.renderServerCard(ctx, x, cardY, s, mode);
        });

        const rows = Math.ceil(shown.length / GRID_COLS);
        return y + rows * GRID_CARD_H + (rows - 1) * GRID_GAP + SECTION_GAP;
    }

    private renderServerCard(
        ctx: Canvas2DContext,
        x: number,
        y: number,
        s: IServerAnalyticsSummary,
        mode: '24h' | '7d',
    ) {
        renderCard(ctx, x, y, GRID_CARD_W, GRID_CARD_H);

        const innerX = x + 14;
        const innerW = GRID_CARD_W - 28;

        // 服务器名
        ctx.textBaseline = 'top';
        drawFitText(
            ctx,
            s.serverName,
            innerX,
            y + 12,
            innerW,
            13,
            9,
            CANVAS_COLORS.TEXT,
            'left',
            'sans',
        );

        // 整宽 sparkline(按段选择 24h 或 近7日 序列)
        const series = mode === '24h' ? s.series : s.series7d;
        this.drawSparkline(ctx, innerX, y + 38, innerW, 42, series, false);

        // 底部数值(峰值 / 当前 或 今日 / 均值)
        const labelFont = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        const valueFont = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.bold,
            'mono',
        );
        ctx.textBaseline = 'middle';

        const counts = series.map((d) => d.count);
        const avg =
            counts.length > 0
                ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)
                : 0;
        const peak = mode === '24h' ? s.peak : s.peak7d;
        const lastLabel = mode === '24h' ? '当前 ' : '今日 ';
        const lastVal =
            counts.length > 0 ? `${counts[counts.length - 1]}` : '—';

        drawSegments(
            ctx,
            innerX,
            y + GRID_CARD_H - 38,
            [
                { text: '峰值 ', color: CANVAS_COLORS.TEXT_MUTED, font: labelFont },
                { text: `${peak}`, color: CANVAS_COLORS.VALUE, font: valueFont },
                { text: `  ${lastLabel}`, color: CANVAS_COLORS.TEXT_MUTED, font: labelFont },
                { text: lastVal, color: CANVAS_COLORS.AMBER_500, font: valueFont },
                { text: '  均值 ', color: CANVAS_COLORS.TEXT_MUTED, font: labelFont },
                { text: `${avg}`, color: CANVAS_COLORS.TEXT, font: valueFont },
            ],
            'left',
        );

        // 峰值采样时间行: "在 XXXX 达到最高"(24h 精确到小时, 7日 精确到日期)
        const peakDate = this.peakDateOf(series);
        const smallFont = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        if (peakDate) {
            drawSegments(
                ctx,
                innerX,
                y + GRID_CARD_H - 16,
                [
                    { text: '在 ', color: CANVAS_COLORS.TEXT_MUTED, font: smallFont },
                    { text: peakDate, color: CANVAS_COLORS.VALUE, font: smallFont },
                    { text: ' 达到最高', color: CANVAS_COLORS.TEXT_MUTED, font: smallFont },
                ],
                'left',
            );
        } else {
            ctx.font = smallFont;
            ctx.fillStyle = CANVAS_COLORS.TEXT_MUTED;
            ctx.textAlign = 'left';
            ctx.fillText('暂无趋势数据', innerX, y + GRID_CARD_H - 16);
        }

        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
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
        let y = PAD;
        y = this.renderTitle(ctx, y);
        y = this.renderKpiRow(ctx, y);
        y = this.renderTrendRow(ctx, y);
        y = this.renderRankingSection(ctx, y);
        y = this.renderServerGridSection(ctx, y, '各服务器24h趋势', '24h');
        y = this.renderServerGridSection(ctx, y, '各服务器近7日趋势', '7d');
        return y;
    }
}
