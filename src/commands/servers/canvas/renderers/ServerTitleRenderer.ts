import { Canvas2DContext } from '../../../../services/canvasBackend';
import { OnlineServerItem } from '../../types/types';
import { getServersHeaderDisplaySectionText, getCountColor } from '../../utils/utils';

/**
 * 服务器标题渲染器
 * 负责渲染服务器列表的标题信息
 */
export class ServerTitleRenderer {
    private renderStartY: number;

    constructor(renderStartY: number) {
        this.renderStartY = renderStartY;
    }

    /**
     * 获取当前的 Y 坐标
     */
    getCurrentY(): number {
        return this.renderStartY;
    }

    /**
     * 渲染服务器列表标题
     * @param context - Canvas 上下文
     * @param serverList - 服务器列表
     * @returns 渲染的总宽度
     */
    render(context: Canvas2DContext, serverList: OnlineServerItem[]): number {
        const titleData = getServersHeaderDisplaySectionText(serverList);
        const totalTitle =
            titleData.serversTotalSection +
            titleData.playersTotalStaticSection +
            titleData.playersCountSection;

        // 渲染服务器总数和玩家总数静态文本
        context.fillStyle = '#fff';
        context.fillText(
            titleData.serversTotalSection + titleData.playersTotalStaticSection,
            10,
            10,
        );

        const staticWidth = context.measureText(
            titleData.serversTotalSection + titleData.playersTotalStaticSection,
        ).width;

        // 计算总玩家数和服务器容量
        const allServersCapacity = serverList.reduce(
            (acc, cur) => acc + cur.max_players,
            0,
        );
        const allPlayersCount = serverList.reduce(
            (acc, cur) => acc + cur.current_players,
            0,
        );

        // 根据玩家数量设置颜色
        context.fillStyle = getCountColor(allPlayersCount, allServersCapacity);
        context.fillText(
            titleData.playersCountSection,
            10 + staticWidth,
            10,
        );

        this.renderStartY = 10 + 40 + 10;

        return context.measureText(totalTitle).width;
    }
}
