import { IRegister } from '../../types';
import { formatOutput } from './utils';
import {
    getAllCmdLog,
    getLogByCmd,
    getLogByCmdAndUser,
    getLogByUser,
    getLogByCmd7Days,
    getAllCmdLog7Days,
} from './db';

export const LogSelfRegister: IRegister = {
    name: 'logself',
    description:
        '获取自己的命令使用日志, 支持 0 ~ 1 个参数, 1 个参数时为命令全名[15s CD]',
    hint: [
        '查询自己使用命令次数: #logself',
        '查询指定使用命令参数: #logself servers',
    ],
    alias: 'ls',
    isAdmin: false,
    timesInterval: 15,
    exec: async (ctx) => {
        if (ctx.params.size > 1) {
            await ctx.reply('最多为一个参数, 示例: #logself tdoll');
            return;
        }

        let command = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!command) {
                command = inputParam;
            }
        });

        if (!command) {
            const allCmdLog = await getLogByUser(ctx.event.user_id);
            const output = formatOutput(allCmdLog, 'cmd', '命令用量统计Top 10');
            await ctx.reply(output);
        } else {
            const logData = await getLogByCmdAndUser(
                ctx.event.user_id,
                command
            );
            const output = formatOutput(
                logData,
                'params',
                `命令'${command}'参数用量统计Top 10`
            );
            await ctx.reply(output);
        }
    },
};

export const LogCommandRegister: IRegister = {
    name: 'log',
    description:
        '获取命令使用日志, 支持 0 ~ 1 个参数, 1 个参数时为命令全名[15s CD]',
    hint: [
        '查询所有人命令使用次数: #log',
        '查询所有人指定命令参数: #log servers',
    ],
    isAdmin: false,
    timesInterval: 15,
    exec: async (ctx) => {
        if (ctx.params.size > 1) {
            await ctx.reply('最多为一个参数, 示例: #log tdoll');
            return;
        }

        let command = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!command) {
                command = inputParam;
            }
        });

        if (!command) {
            const allCmdLog = await getAllCmdLog();
            const output = formatOutput(allCmdLog, 'cmd', '命令用量统计Top 10');
            await ctx.reply(output);
        } else {
            const logData = await getLogByCmd(command);
            const output = formatOutput(
                logData,
                'params',
                `命令'${command}'参数用量统计Top 10`
            );
            await ctx.reply(output);
        }
    },
};

export const Log7CommandRegister: IRegister = {
    name: 'log7',
    description:
        '获取最近7天的命令使用日志, 支持 0 ~ 1 个参数, 1 个参数时为命令全名[15s CD]',
    hint: [
        '查询最近7天所有人命令使用次数: #log7',
        '查询最近7天指定命令参数: #log7 servers',
    ],
    isAdmin: false,
    timesInterval: 15,
    exec: async (ctx) => {
        if (ctx.params.size > 1) {
            await ctx.reply('最多为一个参数, 示例: #log7 tdoll');
            return;
        }

        let command = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!command) {
                command = inputParam;
            }
        });

        if (!command) {
            const allCmdLog = await getAllCmdLog7Days();
            const output = formatOutput(
                allCmdLog,
                'cmd',
                '最近7天命令用量统计Top 10'
            );
            await ctx.reply(output);
        } else {
            const logData = await getLogByCmd7Days(command);
            const output = formatOutput(
                logData,
                'params',
                `最近7天命令'${command}'参数用量统计Top 10`
            );
            await ctx.reply(output);
        }
    },
};
