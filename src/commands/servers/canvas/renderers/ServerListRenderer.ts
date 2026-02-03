import { Canvas2DContext } from '../../../../services/canvasBackend';
import { OnlineServerItem } from '../../types/types';
import { getServerInfoDisplaySectionText, getCountColor } from '../../utils/utils';

/**
 * 服务器列表渲染器
 * 负责渲染服务器列表中的每个服务器项
 */
export class ServerListRenderer {
    private renderStartY: number;
    private maxRectWidth: number;

    constructor(renderStartY: number) {
        this.renderStartY = renderStartY;
        this.maxRectWidth = 0;
    }

    /**
     * 获取当前的 Y 坐标
     */
    getCurrentY(): number {
        return this.renderStartY;
    }

    /**
     * 获取最大矩形宽度
     */
    getMaxRectWidth(): number {
        return this.maxRectWidth;
    }

    /**
     * 渲染服务器列表
     * @param context - Canvas 上下文
     * @param serverList - 服务器列表
     */
    render(context: Canvas2DContext, serverList: OnlineServerItem[]): void {
        this.maxRectWidth = 0;

        serverList.forEach((server) => {
            const sectionData = getServerInfoDisplaySectionText(server);

            // 计算完整文本宽度
            const allText =
                sectionData.serverSection +
                sectionData.playersSection +
                sectionData.mapSection;
            const allTextWidth = context.measureText(allText).width;

            if (allTextWidth > this.maxRectWidth) {
                this.maxRectWidth = allTextWidth;
            }

            // 渲染服务器名称
            context.fillStyle = '#fff';
            context.fillText(
                sectionData.serverSection,
                20,
                10 + this.renderStartY,
            );
            const serverSectionWidth = context.measureText(
                sectionData.serverSection,
            ).width;

            // 渲染玩家数量（带颜色）
            context.fillStyle = getCountColor(server.current_players, server.max_players);
            context.fillText(
                sectionData.playersSection,
                20 + serverSectionWidth,
                10 + this.renderStartY,
            );
            const playersSectionWidth = context.measureText(
                sectionData.playersSection,
            ).width;

            // 渲染地图名称
            context.fillStyle = '#fff';
            context.fillText(
                sectionData.mapSection,
                20 + serverSectionWidth + playersSectionWidth,
                10 + this.renderStartY,
            );

            this.renderStartY += 40;
        });
    }
}
