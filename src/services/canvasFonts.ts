import fs from 'node:fs';
import path from 'node:path';
import { FontLibrary } from 'skia-canvas';

let initialized = false;

/**
 * 字体族 token:
 *   sans — 正文(中文优先 Noto Sans CJK SC)
 *   mono — 命令名/代码/数值(Consolas 打头, 中文回退到 Noto Sans CJK SC)
 */
export const CANVAS_FONT_FAMILY_SANS =
    'Noto Sans CJK SC, Noto Sans SC, WenQuanYi Zen Hei, Noto Color Emoji, sans-serif';

export const CANVAS_FONT_FAMILY_MONO =
    'Consolas, Noto Sans CJK SC, Noto Sans SC, WenQuanYi Zen Hei, Noto Color Emoji, sans-serif';

/** 兼容旧导出(旧画布默认等宽) */
export const CANVAS_FONT_FAMILY = CANVAS_FONT_FAMILY_MONO;

export type CanvasFontFamily = 'sans' | 'mono';

/** 字号 / 字重 token(与 canvasTheme 的间距/圆角 scale 配套) */
export const CANVAS_FONT = {
    family: {
        sans: CANVAS_FONT_FAMILY_SANS,
        mono: CANVAS_FONT_FAMILY_MONO,
    },
    size: {
        xs: 10, // footer、sparkline 刻度
        sm: 11, // 辅助说明、KPI sub
        base: 13, // 正文、玩家数、地图名
        lg: 15, // 卡片标题、头部信息
        xl: 18, // 小节标题
        '2xl': 24, // 页面大标题
    },
    weight: {
        normal: 'normal',
        bold: 'bold',
    },
} as const;

/**
 * 构建 canvas font 串。
 * @param sizePt 字号(pt)
 * @param weight 字重
 * @param family 字体族 token; 默认 mono(保持旧行为, 正文请显式传 'sans')
 */
export function buildCanvasFont(
    sizePt: number,
    weight: 'normal' | 'bold' = 'bold',
    family: CanvasFontFamily = 'mono',
): string {
    return `${weight} ${sizePt}pt ${CANVAS_FONT.family[family]}`;
}

export function initCanvasFonts() {
    if (initialized) {
        return;
    }
    initialized = true;

    // Best-effort: register the bundled font if present.
    // This keeps local + CI rendering more consistent without requiring any user config.
    const bundledConsola = path.join(process.cwd(), 'consola.ttf');
    if (fs.existsSync(bundledConsola)) {
        try {
            // Signature: addFamily(familyName, weight|options, [files])
            const native = (FontLibrary as any).native as
                | { addFamily: (...args: any[]) => unknown }
                | undefined;
            native?.addFamily('Consolas', 400, [bundledConsola]);
            native?.addFamily('Consolas', 700, [bundledConsola]);
        } catch {
            // Ignore font registration failures; rendering will fall back to system fonts.
        }
    }
}
