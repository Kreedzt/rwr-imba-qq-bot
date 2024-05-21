import {IRegister} from "../../types";
import {getLogByCmd, transformSqlData2Table} from "./utils";

export const LogCommandRegister: IRegister = {
    name: 'log',
    description: '获取命令日志, 需要一个参数',
    isAdmin: true,
    exec: async (ctx) => {
        if (ctx.params.size !== 1) {
            await ctx.reply('需要一个参数, 示例: #log tdoll');
            return;
        }

        let command = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!command) {
                command = inputParam;
            }
        })

        const logData = await getLogByCmd(command);

        const output = transformSqlData2Table(logData);

        await ctx.reply(output);
    }
}

