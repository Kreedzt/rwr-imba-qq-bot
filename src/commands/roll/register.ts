import * as _ from 'lodash';
import { logger } from "../../utils/logger";
import { IRegister } from "../../types";

export const RollCommandRegister: IRegister = {
    name: 'roll',
    description: '生成随机数, 需要指定 2 个参数来确定范围(左闭右闭区间).[5s CD]',
    timesInterval: 5,
    isAdmin: false,
    exec: async (ctx) => {
        const params = ctx.params;

        if (params.size !== 2) {
            await ctx.reply('需要 2 个参数来确定范围!示例: #roll 1 100');
            return;
        }

        const userInputs: [number, number] = Array.from(params.keys()).map(input => +input) as [number, number];

        await ctx.reply(`依照 ${userInputs[0]} ~ ${userInputs[1]} 范围:\nRoll 出的值为: ${_.random(...userInputs)}`);
    }
}
