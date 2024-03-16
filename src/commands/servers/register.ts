import { logger } from '../../utils/logger';
import { GlobalEnv, IRegister } from '../../types';
import { getStaticHttpPath } from '../../utils/cmdreq';
import { printPng } from './canvas';
import {
    QUERY_USER_IN_SERVERS_LIMIT,
    SERVERS_OUTPUT_FILE,
    WHEREIS_OUTPUT_FILE,
} from './constants';
import {
    countServersMaxPlayers,
    countTotalPlayers,
    getAllServerListDisplay,
    getServerInfoDisplayText,
    getUserInServerListDisplay,
    queryAllServers,
} from './utils';
import { printChartPng, printHoursChartPng } from './chart';
import { AnalysticsTask } from './analysticsTask';
import { AnalysticsHoursTask } from './analyticsHoursTask';
import { parseIgnoreSpace } from '../../utils/cmd';

export const ServersCommandRegister: IRegister = {
    name: 'servers',
    alias: 's',
    description: '查询所有在线的 rwr 服务器列表.[5s CD]',
    isAdmin: false,
    timesInterval: 5,
    exec: async (ctx) => {
        const serverList = await queryAllServers(ctx.env.SERVERS_MATCH_REGEX);
        const text = getAllServerListDisplay(serverList);
        const playersCount = countTotalPlayers(serverList);

        const headerText = `在线服务器数: ${
            serverList.length
        }, 在线玩家数: ${playersCount} / ${countServersMaxPlayers(
            serverList
        )}\n`;

        const serversOutputList: string[] = serverList.map((s) => {
            return getServerInfoDisplayText(s);
        });

        const path = printPng(
            headerText,
            serversOutputList,
            SERVERS_OUTPUT_FILE
        );

        let cqOutput = `[CQ:image,file=${getStaticHttpPath(
            ctx.env,
            SERVERS_OUTPUT_FILE
        )},cache=0,c=8]`;

        if (serverList.length === 0 && ctx.env.SERVERS_FALLBACK_URL) {
            cqOutput += `\n检测到当前服务器列表为空, 请尝试使用备用查询地址: ${ctx.env.SERVERS_FALLBACK_URL}`;
        }

        //const headerText = `在线服务器数: ${serverList.length}, 在线玩家数: ${playersCount}\n`;
        // const totalText = headerText + '当前在线的服务器列表:\n' + text;

        await ctx.reply(cqOutput);
    },
};

export const WhereIsCommandRegister: IRegister = {
    name: 'whereis',
    alias: 'w',
    description: '查询玩家所在的 rwr 服务器, 需要一个参数.[5s CD]',
    isAdmin: false,
    timesInterval: 5,
    parseParams: (msg: string) => {
        return parseIgnoreSpace(['#whereis', '#w'], msg);
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
        const serverList = await queryAllServers(ctx.env.SERVERS_MATCH_REGEX);
        logger.info('> call getUserInServerListDisplay', targetName);
        const content = getUserInServerListDisplay(targetName, serverList);
        const count = content.total;

        const titleText = `查询 '${targetName}' 所在服务器结果:\n`;
        let footerText = '';
        if (count === 0) {
            footerText = '未找到玩家';
        } else {
            footerText += `共计 ${count} 位玩家结果(只展示 ${QUERY_USER_IN_SERVERS_LIMIT} 位玩家列表)`;
        }

        const totalText = [...content.results, footerText];

        const path = printPng(titleText, totalText, WHEREIS_OUTPUT_FILE);

        let cqOutput = `[CQ:image,file=${getStaticHttpPath(
            ctx.env,
            WHEREIS_OUTPUT_FILE
        )},cache=0,c=8]`;

        if (serverList.length === 0 && ctx.env.SERVERS_FALLBACK_URL) {
            cqOutput += `\n检测到当前服务器列表为空, 请尝试使用备用查询地址: ${ctx.env.SERVERS_FALLBACK_URL}`;
        }

        await ctx.reply(cqOutput);
    },
};

export const AnalyticsCommandRegister: IRegister = {
    name: 'analytics',
    alias: 'a',
    description:
        '查询服务器统计信息(参数 h 表明查询最近 24 小时的数据, 参数 d 表明查询最近 7 天的数据).[15s CD]',
    isAdmin: false,
    timesInterval: 15,
    exec: async (ctx) => {
        let queryParam = 'd';

        ctx.params.forEach((checked, inputParam) => {
            queryParam = inputParam;
        });

        let path = '';
        switch (queryParam) {
            // 按小时查询
            case 'h': {
                path = await printHoursChartPng();
                break;
            }
            // 按 7 天查询
            case 'd':
            default: {
                path = await printChartPng();
            }
        }

        await ctx.reply('正在生成统计图, 过程可能需要1分钟, 请稍后...');

        const cqOutput = `[CQ:image,file=${getStaticHttpPath(
            ctx.env,
            path
        )},cache=0,c=8]`;

        await ctx.reply(cqOutput);
    },
    init: (env: GlobalEnv) => {
        logger.info('AnalysticsCommandRegister::init()');
        AnalysticsTask.start(env);
        AnalysticsHoursTask.start(env);
    },
};
