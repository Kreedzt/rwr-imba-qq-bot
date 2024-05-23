import { IRegister } from '../../types';
import { formatOutput } from './utils';
import { getAllCmdLog, getLogByCmd } from './db';

export const LogCommandRegister: IRegister = {
    name: 'log',
    description: '获取命令使用日志, 支持 0 ~ 1 个参数, 1 个参数时为命令全名',
    isAdmin: true,
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
