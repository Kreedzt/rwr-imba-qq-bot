import { logger } from "../../logger";
import { RemoteService } from "../../services";
import { IRegister } from "../../types";
import { QUERY_USER_IN_SERVERS_LIMIT } from "./constants";
import { getAllServerListDisplay, getServerInfoDisplayText, getUserInServerListDisplay, queryAllServers } from "./utils";

export const ServersCommandRegister: IRegister = {
    name: 'servers',
    description: '查询所有在线的 rwr 服务器列表',
    isAdmin: false,
    exec: async (ctx) => {
        const serverList = await queryAllServers();
        const text = getAllServerListDisplay(serverList);

        const totalText = '当前在线的服务器列表:\n' + text;

        await ctx.reply(totalText);
    }
};

export const WhereIsCommandRegister: IRegister = {
    name: 'whereis',
    description: '查询玩家所在的 rwr 服务器, 需要一个参数',
    isAdmin: false,
    exec: async (ctx) => {
        let targetName: string = '';
        if (ctx.params.size === 0) {
            await ctx.reply('需要一个用户名参数!\n示例: #whereis kreedzt');
            return;
        }
        ctx.params.forEach((_v, name) => {
            if (!targetName) {
                targetName = name.toUpperCase();
            }
        });

        if (!targetName) {
            return;
        }
        const serverList = await queryAllServers();
        logger.info('> call getUserInServerListDisplay', targetName);
        const { text, count } = getUserInServerListDisplay(targetName, serverList);

        const titleText = `查询 '${targetName}' 所在服务器结果:\n`;
        let bodyText = '';
        if (count === 0) {
            bodyText = '未找到玩家';
        } else {
            bodyText += text;

            bodyText += `\n共计 ${count} 位玩家结果(只展示 ${QUERY_USER_IN_SERVERS_LIMIT} 位玩家列表)`;
        }

        const totalText = titleText + bodyText;

        await ctx.reply(totalText);
    }
}
