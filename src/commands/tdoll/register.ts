import { IRegister } from '../../types';
import {
    getTDollDataRes,
    getTDollDataWithCategoryRes,
    getTDollSkinReplyText,
} from './utils';
import { TDollSvc } from './tdoll.service';
import { TDollSkinSvc } from './tdollskin.service';
import { logger } from '../../utils/logger';
import { TDOLL_SKIN_END_TEXT } from './constants';

export const TDollCommandRegister: IRegister = {
    name: 'tdoll',
    alias: 'td',
    description: '根据枪名查询数据, 支持模糊匹配, 忽略大小写及符号.[10s CD]',
    hint: [
        '按名称查询指定武器数据: #tdoll M4A1',
        '按名称模糊查询武器数据: #tdoll m4',
        '随机武器: #tdoll random',
        '随机 AR 武器: #tdoll random ar',
    ],
    timesInterval: 10,
    isAdmin: false,
    exec: async (ctx) => {
        if (ctx.params.size < 1 || ctx.params.size > 2) {
            await ctx.reply(
                '参数不正确, 示例: #tdoll M4A1, #tdoll random(random 为随机返回), #tdoll m4 ar(查询突击步枪), #tdoll random ar(随机突击步枪)'
            );
            return;
        }

        const tdollData = await TDollSvc.getData();
        if (ctx.params.size === 1) {
            let query: string = '';

            ctx.params.forEach((checked, inputParam) => {
                if (!query) {
                    query = inputParam;
                }
            });

            const replyText = getTDollDataRes(tdollData, query);

            await ctx.reply(replyText);
            return;
        }

        if (ctx.params.size === 2) {
            let query: string = '';
            let query2: string = '';

            ctx.params.forEach((checked, inputParam) => {
                if (!query) {
                    query = inputParam;
                } else {
                    query2 = inputParam;
                }
            });

            const replyText = getTDollDataWithCategoryRes(
                tdollData,
                query,
                query2
            );

            await ctx.reply(replyText);
        }
    },
};

export const TDollSkinCommandRegister: IRegister = {
    name: 'tdollskin',
    alias: 'ts',
    description: '根据武器编号查询皮肤数据, 需要输入一个编号参数.[10s CD]',
    hint: ['查询指定 ID 武器皮肤数据: #tdollskin 2'],
    timesInterval: 10,
    isAdmin: false,
    exec: async (ctx) => {
        if (ctx.params.size !== 1) {
            await ctx.reply('需要1个参数, 示例: #tdollskin 2');
            return;
        }

        const start = Date.now();
        const [tdollData, tdollSkinData] = await Promise.all([
            TDollSvc.getData(),
            TDollSkinSvc.getData(),
        ]);
        const end = Date.now();
        logger.info(`fetch tdoll & tdollSkinData time: ${end - start}ms`);

        let query: string = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!query) {
                query = inputParam;
            }
        });

        let replyText = getTDollSkinReplyText(query, tdollData, tdollSkinData);

        replyText += `\n${TDOLL_SKIN_END_TEXT}`;

        await ctx.reply(replyText);
    },
};
