import { CanvasImgService } from '../../../../services/canvasImg.service';
import { ImageLike, loadImageFrom } from '../../../../services/canvasBackend';
import { CANVAS_STYLE } from '../../types/constants';
import { ITDollDataItem } from '../../types/types';
import { resizeImg } from '../../../../utils/imgproxy';
import { logger } from '../../../../utils/logger';
import { asImageRenderError, ImageRenderError } from '../../../../services/imageRenderErrors';
import { logImageRenderError } from '../../../../services/imageRenderLogger';

/**
 * TDoll 数据提供者
 * 负责加载和管理 TDoll 相关图片资源
 */
export class TDollDataProvider {
    private imgMap = new Map<string, ImageLike>();

    /**
     * 获取图片映射表
     */
    getImgMap(): Map<string, ImageLike> {
        return this.imgMap;
    }

    /**
     * 加载单个 TDoll 的图片
     * @param tdoll - TDoll 数据
     */
    private async loadTdollImages(tdoll: ITDollDataItem): Promise<void> {
        try {
            // 加载普通头像
            const avatarUrl = resizeImg(
                tdoll.avatar,
                CANVAS_STYLE.IMAGE_SIZE,
                CANVAS_STYLE.IMAGE_SIZE,
            );
            const avatarImg = await loadImageFrom(avatarUrl);
            this.imgMap.set(tdoll.id, avatarImg);

            // 如果有 MOD 版本，加载 MOD 头像
            if (tdoll.mod === '1' && tdoll.avatarMod) {
                const avatarModImg = await loadImageFrom(
                    resizeImg(
                        tdoll.avatarMod,
                        CANVAS_STYLE.IMAGE_SIZE,
                        CANVAS_STYLE.IMAGE_SIZE,
                    ),
                );
                this.imgMap.set(`${tdoll.id}__mod`, avatarModImg);
            }
        } catch (error) {
            console.error(error);
            logger.error(error);
            logImageRenderError(
                asImageRenderError(error, {
                    code: 'IMAGE_LOAD_FAILED',
                    message: `Failed to load image for tdoll ${tdoll.id}`,
                    context: {
                        scene: 'tdoll2:loadAllImg',
                        inputSummary: tdoll.id,
                    },
                }),
            );
        }
    }

    /**
     * 加载所有 TDoll 的图片
     * @param tdolls - TDoll 数据数组
     */
    async loadAllImages(tdolls: ITDollDataItem[]): Promise<void> {
        try {
            await Promise.all(
                tdolls.map(tdoll => this.loadTdollImages(tdoll))
            );
        } catch (error) {
            const wrapped = asImageRenderError(error, {
                code: 'IMAGE_LOAD_FAILED',
                message: 'Failed to load images',
                context: { scene: 'tdoll2:loadAllImg' },
            });
            logImageRenderError(wrapped);
            throw wrapped;
        }
    }
}
