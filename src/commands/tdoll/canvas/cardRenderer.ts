import { Canvas2DContext, ImageLike } from '../../../services/canvasBackend';
import { buildCanvasFont, CANVAS_FONT } from '../../../services/canvasFonts';
import {
    TextSegment,
    colorWithAlpha,
    drawSegments,
    roundRectPath,
    truncate,
} from '../../../services/canvasHelpers';
import { renderCard } from '../../../services/canvasLayout';
import {
    CANVAS_COLORS,
    CANVAS_RADIUS,
    CANVAS_SPACE,
} from '../../../services/canvasTheme';
import { TDollCategoryEnum } from '../types/enums';
import { ITDollDataItem } from '../types/types';
import { splitByQueryMatch } from '../utils/query';
import { AVATAR_RENDER_SIZE, getModAvatarKey } from './assets';

export const CARD_W = 380;
export const CARD_H = 76;
export const CARD_GAP = CANVAS_SPACE[3];

const CARD_PAD = CANVAS_SPACE[4];
const AVATAR_RADIUS = CANVAS_RADIUS.sm;
const AVATAR_GAP = CANVAS_SPACE[1];
const BADGE_H = 20;
const BADGE_PAD_X = CANVAS_SPACE[2];
const MOD_TAG_H = 16;
const MOD_TAG_PAD_X = 6;

/** 查询命中高亮色(与标题 query 段一致) */
export const QUERY_HIGHLIGHT_COLOR = CANVAS_COLORS.AMBER_400;

/** 枪种识别色(命令级 palette, 见 TDOLL_CLASS_BADGE) */
const TDOLL_CLASS_FG: Record<TDollCategoryEnum, string> = {
    [TDollCategoryEnum.AR]: '#f87171',
    [TDollCategoryEnum.SMG]: '#22d3ee',
    [TDollCategoryEnum.RF]: '#fcd34d',
    [TDollCategoryEnum.MG]: '#a78bfa',
    [TDollCategoryEnum.SG]: '#4ade80',
    [TDollCategoryEnum.HG]: '#f472b6',
};

/** 枪种徽章配色: 文字主色 + 同色 16% 透明底(底色由 fg 推导) */
export const TDOLL_CLASS_BADGE: Record<
    TDollCategoryEnum,
    { fg: string; bg: string }
> = Object.fromEntries(
    Object.entries(TDOLL_CLASS_FG).map(([cls, fg]) => [
        cls,
        { fg, bg: colorWithAlpha(fg, 0.16) },
    ]),
) as Record<TDollCategoryEnum, { fg: string; bg: string }>;

export interface TDollCardModel {
    id: string;
    name: string;
    typeText: string;
    tdollClass?: TDollCategoryEnum;
    isMod: boolean;
    /** 用于名称命中高亮的原始查询词 */
    query: string;
}

export const buildCardModel = (
    tdoll: ITDollDataItem,
    query: string,
): TDollCardModel => ({
    id: tdoll.id,
    name: tdoll.nameIngame || '',
    typeText: tdoll.type || '',
    tdollClass: tdoll.tdollClass,
    isMod: tdoll.mod === '1',
    query,
});

/**
 * 列表列数决策: ≤3 项单列, ≥4 项双列(入参已被上游截为 ≤10 → 最多 5 行)。
 */
export const computeCardGridLayout = (
    count: number,
): { cols: 1 | 2; rows: number } => {
    const cols: 1 | 2 = count >= 4 ? 2 : 1;
    return { cols, rows: Math.max(1, Math.ceil(count / cols)) };
};

const drawAvatar = (
    ctx: Canvas2DContext,
    img: ImageLike | undefined,
    x: number,
    y: number,
): void => {
    if (img) {
        ctx.save();
        roundRectPath(ctx, x, y, AVATAR_RENDER_SIZE, AVATAR_RENDER_SIZE, AVATAR_RADIUS);
        ctx.clip();
        ctx.drawImage(img as any, x, y, AVATAR_RENDER_SIZE, AVATAR_RENDER_SIZE);
        ctx.restore();
        return;
    }

    // 缺图占位: 深色圆角块
    ctx.fillStyle = CANVAS_COLORS.CHIP_BG;
    roundRectPath(ctx, x, y, AVATAR_RENDER_SIZE, AVATAR_RENDER_SIZE, AVATAR_RADIUS);
    ctx.fill();
};

const buildNameSegments = (
    ctx: Canvas2DContext,
    model: TDollCardModel,
    maxWidth: number,
): TextSegment[] => {
    const nameFont = buildCanvasFont(
        CANVAS_FONT.size.lg,
        CANVAS_FONT.weight.bold,
        'sans',
    );
    ctx.font = nameFont;
    const displayName = truncate(ctx, model.name, maxWidth);

    const matched = splitByQueryMatch(displayName, model.query);
    if (!matched) {
        return [{ text: displayName, color: CANVAS_COLORS.TEXT, font: nameFont }];
    }

    return [
        { text: matched.before, color: CANVAS_COLORS.TEXT, font: nameFont },
        { text: matched.match, color: QUERY_HIGHLIGHT_COLOR, font: nameFont },
        { text: matched.after, color: CANVAS_COLORS.TEXT, font: nameFont },
    ].filter((s) => s.text.length > 0);
};

/**
 * 在 (x, y) 绘制一张人形卡片, 返回卡片底部 y。
 * width 缺省为 CARD_W(列表网格用), 详情画布可传内容全宽拉伸。
 */
export const drawTDollCard = (
    ctx: Canvas2DContext,
    x: number,
    y: number,
    model: TDollCardModel,
    imgMap: Map<string, ImageLike>,
    width: number = CARD_W,
): number => {
    // 卡片面板(顶层卡片带默认 shadow-1)
    renderCard(ctx, x, y, width, CARD_H, {
        fillStyle: CANVAS_COLORS.BG_OVERLAY,
    });

    // 左侧头像(mod 版双头像并排)
    const avatarTop = (CARD_H - AVATAR_RENDER_SIZE) / 2;
    const avatarY = y + avatarTop;
    const baseImg = imgMap.get(model.id);
    const modImg = model.isMod
        ? imgMap.get(getModAvatarKey(model.id))
        : undefined;

    drawAvatar(ctx, baseImg, x + CARD_PAD, avatarY);
    let avatarBlockW = AVATAR_RENDER_SIZE;
    if (modImg) {
        drawAvatar(
            ctx,
            modImg,
            x + CARD_PAD + AVATAR_RENDER_SIZE + AVATAR_GAP,
            avatarY,
        );
        avatarBlockW = AVATAR_RENDER_SIZE * 2 + AVATAR_GAP;
    }

    const textX = x + CARD_PAD + avatarBlockW + CANVAS_SPACE[3];
    const textMaxRight = x + width - CARD_PAD;

    // mod 角标(右上角)
    let modTagW = 0;
    if (model.isMod) {
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.xs,
            CANVAS_FONT.weight.bold,
            'mono',
        );
        modTagW = ctx.measureText('MOD').width + MOD_TAG_PAD_X * 2;
        const tagX = x + width - CARD_PAD - modTagW;
        const tagY = y + CANVAS_SPACE[2];
        ctx.fillStyle = CANVAS_COLORS.ACCENT;
        roundRectPath(ctx, tagX, tagY, modTagW, MOD_TAG_H, MOD_TAG_H / 2);
        ctx.fill();
        ctx.fillStyle = CANVAS_COLORS.BG;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MOD', tagX + modTagW / 2, tagY + MOD_TAG_H / 2 + 0.5);
    }

    // 行 1: No.<id> <名称>(命中高亮)
    // 名称顶端与头像顶端对齐; ID 前缀与名称共用 alphabetic baseline,
    // 避免不同字号因 em-top 对齐导致视觉上高低不一。
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const idFont = buildCanvasFont(
        CANVAS_FONT.size.sm,
        CANVAS_FONT.weight.normal,
        'mono',
    );
    const idPrefixSegments: TextSegment[] = [
        { text: 'No.', color: CANVAS_COLORS.MUTED, font: idFont },
        { text: model.id, color: CANVAS_COLORS.VALUE, font: idFont },
        { text: '  ', color: CANVAS_COLORS.TEXT, font: idFont },
    ];
    const prefixWidth = idPrefixSegments.reduce((w, s) => {
        ctx.font = s.font;
        return w + ctx.measureText(s.text).width;
    }, 0);
    const nameMaxW = Math.max(
        20,
        textMaxRight - textX - prefixWidth - (model.isMod ? modTagW + CANVAS_SPACE[2] : 0),
    );
    const nameSegments = buildNameSegments(ctx, model, nameMaxW);
    // buildNameSegments 最后把 ctx.font 设为 nameFont, 直接量出实际 ascent
    const nameAscent = ctx.measureText(model.name || 'M').actualBoundingBoxAscent;
    const nameBaselineY = y + avatarTop + nameAscent;
    drawSegments(ctx, textX, nameBaselineY, [...idPrefixSegments, ...nameSegments]);

    // 行 2: 枪种徽章 + 中文枪种
    const row2CenterY = y + CARD_H - CARD_PAD - BADGE_H / 2;
    let typeTextX = textX;

    const badge = model.tdollClass
        ? TDOLL_CLASS_BADGE[model.tdollClass]
        : undefined;
    if (badge) {
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.bold,
            'mono',
        );
        const badgeTextW = ctx.measureText(model.tdollClass!).width;
        const badgeW = badgeTextW + BADGE_PAD_X * 2;
        const badgeY = row2CenterY - BADGE_H / 2;

        ctx.fillStyle = badge.bg;
        roundRectPath(ctx, textX, badgeY, badgeW, BADGE_H, BADGE_H / 2);
        ctx.fill();

        ctx.fillStyle = badge.fg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(model.tdollClass!, textX + badgeW / 2, row2CenterY + 0.5);

        typeTextX = textX + badgeW + CANVAS_SPACE[2];
    }

    if (model.typeText) {
        ctx.font = buildCanvasFont(
            CANVAS_FONT.size.sm,
            CANVAS_FONT.weight.normal,
            'sans',
        );
        ctx.fillStyle = CANVAS_COLORS.MUTED;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            truncate(ctx, model.typeText, textMaxRight - typeTextX),
            typeTextX,
            row2CenterY + 0.5,
        );
    }

    ctx.textBaseline = 'top';
    return y + CARD_H;
};
