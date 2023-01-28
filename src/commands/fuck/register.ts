import * as _ from 'lodash';
import { logger } from "../../logger";
import { IRegister } from "../../types";

export const FuckCommandRegister: IRegister = {
    name: 'fuck',
    description: '重启Bot',
    isAdmin: true,
    exec: async (ctx) => {
        await ctx.reply(`已收到命令, 准备执行重启...`);
        process.exit(-1);
    }
}
