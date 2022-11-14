import { logger } from "../../logger";
import { RemoteService } from "../../services";
import { IRegister } from "../../types";
import { QUERY_USER_IN_SERVERS_LIMIT } from "./constants";
import { countTotalPlayers, getAllServerListDisplay, getServerInfoDisplayText, getUserInServerListDisplay, queryAllServers } from "./utils";

export const ServersCommandRegister: IRegister = {
    name: 'servers',
    description: '查询所有在线的 rwr 服务器列表.[5s CD]',
    isAdmin: false,
    timesInterval: 5,
    exec: async (ctx) => {
        const serverList = await queryAllServers();
        const text = getAllServerListDisplay(serverList);
        const playersCount = countTotalPlayers(serverList);

        const headerText = `在线服务器数: ${serverList.length}, 在线玩家数: ${playersCount}\n`;
        const totalText = headerText + '当前在线的服务器列表:\n' + text;

        await ctx.reply(totalText);
    }
};

export const WhereIsCommandRegister: IRegister = {
    name: 'whereis',
    description: '查询玩家所在的 rwr 服务器, 需要一个参数.[5s CD]',
    isAdmin: false,
    timesInterval: 5,
    parseParams: (msg: string) => {
        const step1Msg = msg.replace('#whereis', '');
        let skipped = true;
        let targetName = '';

        const params = new Map<string, boolean>();

        let hasNameStart = false;
        step1Msg.split(' ').forEach((userInput) => {
            if (userInput === '' && skipped) {
                skipped = false;
            } else if (userInput === '') {
                if (hasNameStart) {
                    targetName += ' ';
                }
            } else {
                if (hasNameStart) {
                    targetName += ' ' + userInput;
                } else {
                    targetName += userInput;
                }
                hasNameStart = true;
            }
        });

        if (targetName) {
            params.set(targetName, true);
        }

        return params;
    },
    exec: async (ctx) => {
        if (ctx.params.size === 0) {
            await ctx.reply('需要一个用户名参数!\n示例: #whereis KREEDZT');
            return;
        }

        let targetName = '';

        ctx.params.forEach((_v, name) => {
            if (!targetName) {
                targetName = name;
            }
        });

        if (!targetName) {
            return;
        }
        const serverList = await queryAllServers();
        logger.info('> call getUserInServerListDisplay', targetName);
        const { text, count } = getUserInServerListDisplay(targetName, serverList);

        const titleText = `查询 '${targetName}'所在服务器结果:\n`;
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
