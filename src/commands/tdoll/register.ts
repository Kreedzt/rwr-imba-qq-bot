import { IRegister } from '../../types';
import { ITDollDataItem, ITDollSkinDataItem } from './types';
import {
    getTdollDataRes,
    getTDollSkinReplyText,
    readTdollData,
    readTdollSkinData,
} from './utils';

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

        const replyText = getTdollDataRes(tdollData, query);

        await ctx.reply(replyText);
    },
};

let tdollSkinData: Record<string, ITDollSkinDataItem> = {};

export const TDollSkinCommandRegister: IRegister = {
    name: 'tdollskin',
    alias: 'ts',
    description: '根据武器编号查询皮肤数据, 需要输入一个编号参数.[10s CD]',
    timesInterval: 10,
    isAdmin: false,
    exec: async (ctx) => {
        if (ctx.params.size !== 1) {
            await ctx.reply('需要1个参数, 示例: #tdollskin 2');
            return;
        }

        if (Object.keys(tdollSkinData).length === 0) {
            tdollSkinData = readTdollSkinData(ctx.env.TDOLL_SKIN_DATA_FILE);
        }

        let query: string = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!query) {
                query = inputParam;
            }
        });

        const replyText = getTDollSkinReplyText(
            query,
            tdollData,
            tdollSkinData
        );

        await ctx.reply(replyText);
    },
};
