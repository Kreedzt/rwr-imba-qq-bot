import { Canvas2DContext, ImageLike } from '../../../../services/canvasBackend';
import { CANVAS_STYLE } from '../../types/constants';
import { ITDollDataItem } from '../../types/types';

/**
 * TDoll 图像渲染器
 * 负责渲染 TDoll 头像图像
 */
export class TDollImageRenderer {
    private renderStartY: number;
    private imgMap: Map<string, ImageLike>;

    constructor(renderStartY: number, imgMap: Map<string, ImageLike>) {
        this.renderStartY = renderStartY;
        this.imgMap = imgMap;
    }

    /**
     * 获取当前的 Y 坐标
     */
    getCurrentY(): number {
        return this.renderStartY;
    }

    /**
     * 渲染单个 TDoll 的图像
     * @param context - Canvas 上下文
     * @param tdoll - TDoll 数据
     * @returns 渲染的最大宽度
     */
    render(context: Canvas2DContext, tdoll: ITDollDataItem): number {
        let maxWidth = 0;
        let offsetX = CANVAS_STYLE.PADDING * 2;

        const renderImage = (image: ImageLike | undefined) => {
            if (image) {
                context.drawImage(
                    image,
                    offsetX,
                    this.renderStartY,
                    CANVAS_STYLE.IMAGE_SIZE,
                    CANVAS_STYLE.IMAGE_SIZE,
                );
                offsetX += CANVAS_STYLE.IMAGE_SIZE;
                maxWidth = Math.max(maxWidth, offsetX);
            }
        };

        // 渲染普通头像
        renderImage(this.imgMap.get(tdoll.id));

        // 如果有 MOD 版本，渲染 MOD 头像
        if (tdoll.mod === '1') {
            renderImage(this.imgMap.get(`${tdoll.id}__mod`));
        }

        // 更新 Y 坐标
        this.renderStartY += CANVAS_STYLE.IMAGE_SIZE;

        return maxWidth;
    }
}
