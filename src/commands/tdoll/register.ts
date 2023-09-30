import { IRegister } from '../../types';
import { ITDollDataItem } from './types';
import { getTdollDataRes, readTdollData } from './utils';

let tdollData: ITDollDataItem[] = [];

export const TDollCommandRegister: IRegister = {
    name: 'tdoll',
    alias: 'td',
    description: '根据枪名查询数据, 支持模糊匹配, 忽略大小写及符号.[10s CD]',
    timesInterval: 10,
    isAdmin: false,
    exec: async (ctx) => {
        if (ctx.params.size !== 1) {
            await ctx.reply('需要一个参数, 示例: #tdoll M4A1');
            return;
        }

        if (tdollData.length === 0) {
            tdollData = readTdollData(ctx.env.TDOLL_DATA_FILE);
        }

        let query: string = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!query) {
                query = inputParam;
            }
        });

        const replayText = getTdollDataRes(tdollData, query);

        await ctx.reply(replayText);
    },
};
