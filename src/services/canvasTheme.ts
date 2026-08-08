/**
 * 画布共享设计 Token — 全部图片输出统一的设计语言(暖棕+琥珀 军事/复古风格)。
 * 原则(Refactoring UI):
 *   1. 颜色/间距/圆角/阴影统一从本模块读取, 禁止在 canvas 里裸写 hex/rgba;
 *   2. 语义优先: 用 SUCCESS/WARNING/DANGER/INFO 表达状态, 用 AMBER_* 表达强调;
 *   3. 间距走 4px 基线 scale, 圆角走 sm/md/lg 三级 + pill。
 * 注: AMBER_400/600、WARM_200/400、RADIUS.full 等为完整 scale 的预留 token,
 *     当前未被消费属设计预留, 新增画布时优先取用而非另造颜色。
 */

export const CANVAS_COLORS = {
    // 背景
    /** 暖棕底色 */
    BG: '#451a03',
    /** 卡片/面板底色(叠在底色或背景图上均协调) */
    BG_OVERLAY: 'rgba(0, 0, 0, 0.55)',
    /** 更弱的半透明底(空闲态、斑马纹、排行轨道) */
    BG_OVERLAY_WEAK: 'rgba(0, 0, 0, 0.35)',

    // 琥珀强调
    AMBER_400: '#fb923c',
    /** 主强调(accent 竖条 / 徽章 / 填充) */
    AMBER_500: '#f48225',
    AMBER_600: '#ea580c',

    // 暖中性(辅助文本、边框)
    WARM_200: '#e7d5c4',
    /** muted 文本 */
    WARM_300: '#cbb8a3',
    WARM_400: '#a89884',
    WARM_500: '#8a7b6a',

    // 文本
    /** 主文本 */
    TEXT: '#f8fafc',
    /** 弱化文本 */
    TEXT_MUTED: '#cbb8a3',

    /** 数值高亮(琥珀金) */
    VALUE: '#fcd34d',

    // 语义色
    SUCCESS: '#4ade80',
    WARNING: '#fbbf24',
    DANGER: '#f87171',
    INFO: '#67e8f9',

    // 衍生物(带透明度, 避免各 canvas 重复拼 rgba)
    /** 弱化文本 70% */
    MUTED_DIM: 'rgba(203, 184, 163, 0.7)',
    /** 弱化文本 60% */
    MUTED_DIMMER: 'rgba(203, 184, 163, 0.6)',
    /** chip 底色 */
    CHIP_BG: 'rgba(255, 255, 255, 0.08)',
    /** 强调 chip 底色(moderator 等) */
    CHIP_BG_ACCENT: 'rgba(244, 130, 37, 0.22)',
    /** 弱分隔线(sparkline 基线) */
    LINE_WEAK: 'rgba(255, 255, 255, 0.15)',
    /** 强调面积填充(sparkline 面积) */
    AREA_ACCENT: 'rgba(244, 130, 37, 0.18)',

    // ------------------------------------------------------------------
    // 兼容别名(旧命名)—— 供 tdoll/check/ai/welcome 等未改造画布继续使用;
    // 改造中的画布请使用上面的语义名。
    // ------------------------------------------------------------------
    /** 旧卡片底色(0.5 透明度, 与历史 golden 保持一致) */
    CARD: 'rgba(0, 0, 0, 0.5)',
    ACCENT: '#f48225',
    MUTED: '#cbb8a3',
} as const;

/** 间距 scale(4px 基线, Tailwind 风格) */
export const CANVAS_SPACE: { readonly [key: number]: number } = {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
};

/** 圆角 scale */
export const CANVAS_RADIUS = {
    /** 行、小标签 */
    sm: 6,
    /** 趋势卡、内部面板 */
    md: 10,
    /** 主卡片 */
    lg: 12,
    /** chip 胶囊 */
    full: 9999,
} as const;

export interface CanvasShadow {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
}

/** 阴影 scale(仅用于顶层卡片/面板, 不给行/chip 加阴影) */
export const CANVAS_SHADOW = {
    1: { color: 'rgba(0, 0, 0, 0.35)', blur: 8, offsetX: 0, offsetY: 2 } as const,
} as const;
