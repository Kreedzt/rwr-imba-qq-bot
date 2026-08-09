import { BaseCanvas, CanvasSize } from '../../../services/baseCanvas';
import {
    Canvas2DContext,
    ImageLike,
} from '../../../services/canvasBackend';
import {
    clampCanvasWidth,
    renderPageTitle,
    renderSectionHeader,
} from '../../../services/canvasLayout';
import { CANVAS_COLORS, CANVAS_SPACE } from '../../../services/canvasTheme';
import { ITDollDataItem, ITDollSkinDataItem } from '../types/types';
import { loadSkinImageMap, loadTDollAvatarMap } from './assets';
import {
    CARD_H,
    TDollCardModel,
    buildCardModel,
    drawTDollCard,
} from './cardRenderer';
import { buildQueryTitleSegments } from './queryTitle';
import {
    SKIN_GRID_W,
    SkinGridItem,
    buildSkinGridItems,
    drawSkinGrid,
    measureSkinGridHeight,
} from './skinGridRenderer';

const PAD = CANVAS_SPACE[6];
const TITLE_H = 56;
const SECTION_HEADER_H = 40;
const FOOTER_H = 40;
const WIDTH = clampCanvasWidth(PAD * 2 + SKIN_GRID_W);

/**
 * TDoll 详情画布 — 数据卡 + 皮肤 3 列网格合并为一张图。
 * 同时服务 #td 单结果和 #ts 皮肤查询。
 */
export class TDollDetailCanvas extends BaseCanvas {
    private readonly query: string;
    private readonly tdoll?: ITDollDataItem;
    private readonly skinItems: SkinGridItem[];
    private readonly fileName: string;

    private avatarMap: Map<string, ImageLike> = new Map();
    private skinMap: Awaited<ReturnType<typeof loadSkinImageMap>> | null = null;

    constructor(
        query: string,
        tdolls: ITDollDataItem[],
        record: Record<string, ITDollSkinDataItem>,
        fileName: string,
    ) {
        super();
        this.query = query;
        this.tdoll = tdolls.find((tdoll) => tdoll.id === query);
        this.skinItems = buildSkinGridItems(record[query]);
        this.fileName = fileName;
    }

    private buildCardModelSafe(): TDollCardModel {
        if (this.tdoll) {
            return buildCardModel(this.tdoll, this.query);
        }
        // 数据缺失时的降级卡(皮肤记录存在但人形数据未收录)
        return {
            id: this.query,
            name: '未知人形',
            typeText: '',
            tdollClass: undefined,
            isMod: false,
            query: '',
        };
    }

    private renderTitle(ctx: Canvas2DContext): number {
        return renderPageTitle(ctx, PAD, PAD, '查询 匹配结果', undefined, {
            titleSegments: buildQueryTitleSegments(
                ctx,
                this.query,
                WIDTH - PAD * 2,
            ),
            rightX: WIDTH - PAD,
        });
    }

    private renderSkinSection(ctx: Canvas2DContext, y: number): number {
        return renderSectionHeader(
            ctx,
            y,
            '皮肤',
            `${this.skinItems.length} 款`,
            { x: PAD, rightX: WIDTH - PAD },
        );
    }

    protected async measure(): Promise<CanvasSize> {
        const [avatarMap, skinMap] = await Promise.all([
            this.tdoll
                ? loadTDollAvatarMap([this.tdoll])
                : Promise.resolve(new Map<string, ImageLike>()),
            loadSkinImageMap(this.skinItems),
        ]);
        this.avatarMap = avatarMap;
        this.skinMap = skinMap;

        const gridH = measureSkinGridHeight(this.skinItems.length);
        const height =
            PAD +
            TITLE_H +
            CARD_H +
            CANVAS_SPACE[4] +
            SECTION_HEADER_H +
            gridH +
            FOOTER_H;

        return { width: WIDTH, height };
    }

    protected getFileName(): string {
        return this.fileName;
    }

    protected getBgColor(): string {
        return CANVAS_COLORS.BG;
    }

    protected getRenderScene(): string {
        return 'tdollDetail:render';
    }

    protected getInputSummary(): string {
        return `query=${this.query}, skins=${this.skinItems.length}`;
    }

    protected paint(ctx: Canvas2DContext, size: CanvasSize): number {
        this.renderTitle(ctx);

        let y = PAD + TITLE_H;
        y = drawTDollCard(
            ctx,
            PAD,
            y,
            this.buildCardModelSafe(),
            this.avatarMap,
            SKIN_GRID_W,
        );

        y = this.renderSkinSection(ctx, y + CANVAS_SPACE[4]);
        drawSkinGrid(ctx, PAD, y, this.skinItems, this.skinMap!);

        return size.height - FOOTER_H;
    }
}
