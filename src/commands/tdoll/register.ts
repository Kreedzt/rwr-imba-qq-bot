import { IRegister, ParamsType } from '../../types';
import {
    getMatchedTDollData,
    getMatchedTDollDataWithCategory,
    getTDollDataRes,
    getTDollDataWithCategoryRes,
    getTDollSkinReplyText,
    printTDoll2Png,
} from './utils';
import { TDollSvc } from './tdoll.service';
import { TDollSkinSvc } from './tdollskin.service';
import { logger } from '../../utils/logger';
import { TDOLL2_OUTPUT_FILE, TDOLL_SKIN_END_TEXT } from './constants';
import { getStaticHttpPath } from '../../utils/cmdreq';

// 提取公共参数处理逻辑
const getQueryParams = (params: ParamsType): string[] => {
    const queries: string[] = [];
    params.forEach((_, value) => queries.push(value));
    return queries;
};

// 提取公共错误处理
const validateParams = async (
    ctx: any,
    expectedSize: number,
    errorMessage: string
): Promise<boolean> => {
    if (ctx.params.size !== expectedSize) {
        await ctx.reply(errorMessage);
        return false;
    }
    return true;
};

const createTDollCommand = (name: string, alias: string): IRegister => ({
    name,
    alias,
    description: '根据枪名查询数据, 支持模糊匹配, 忽略大小写及符号.[10s CD]',
    hint: [
        `按名称查询指定武器数据: #${alias} M4A1`,
        `按名称模糊查询武器数据: #${alias} m4`,
        `随机武器: #${alias} random`,
        `随机 AR 武器: #${alias} random ar`,
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
});

export const TDollCommandRegister = createTDollCommand('tdoll', 'td');
export const TDoll2CommandRegister: IRegister = {
    name: 'tdoll2',
    alias: 'td2',
    description: '根据枪名查询数据, 支持模糊匹配, 忽略大小写及符号.[10s CD]',
    hint: [
        '按名称查询指定武器数据: #td2 M4A1',
        '按名称模糊查询武器数据: #td2 m4',
        '随机武器: #td2 random',
        '随机 AR 武器: #td2 random ar',
    ],
    timesInterval: 10,
    isAdmin: false,
    exec: async (ctx) => {
        try {
            if (ctx.params.size < 1 || ctx.params.size > 2) {
                await ctx.reply(
                    '参数不正确, 示例: #tdoll M4A1, #tdoll random(random 为随机返回), #tdoll m4 ar(查询突击步枪), #tdoll random ar(随机突击步枪)'
                );
                return;
            }

            const tdollData = await TDollSvc.getData();
            if (ctx.params.size === 1) {
                const [query] = getQueryParams(ctx.params);

                const matchedRes = getMatchedTDollData(tdollData, query);

                if (matchedRes.length === 0) {
                    await ctx.reply('未找到指定枪名, 请检查输入是否有误!');
                    return;
                }

                await printTDoll2Png(query, matchedRes, TDOLL2_OUTPUT_FILE);

                const cqOutput = `[CQ:image,file=${getStaticHttpPath(
                    ctx.env,
                    TDOLL2_OUTPUT_FILE
                )},cache=0,c=8]`;

                await ctx.reply(cqOutput);
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

                const matchedRes = getMatchedTDollDataWithCategory(
                    tdollData,
                    query,
                    query2
                );

                if (matchedRes.length === 0) {
                    await ctx.reply('未找到指定枪名, 请检查输入是否有误!');
                    return;
                }

                await printTDoll2Png(query, matchedRes, TDOLL2_OUTPUT_FILE);

                const cqOutput = `[CQ:image,file=${getStaticHttpPath(
                    ctx.env,
                    TDOLL2_OUTPUT_FILE
                )},cache=0,c=8]`;

                await ctx.reply(cqOutput);
            }
        } catch (error) {
            logger.error(`TDoll2 command error: ${error}`);
            await ctx.reply('查询失败，请稍后重试');
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
        try {
            if (
                !(await validateParams(
                    ctx,
                    1,
                    '需要1个参数, 示例: #tdollskin 2'
                ))
            ) {
                return;
            }

            const start = Date.now();
            const [tdollData, tdollSkinData] = await Promise.all([
                TDollSvc.getData(),
                TDollSkinSvc.getData(),
            ]);
            const end = Date.now();
            logger.info(`fetch tdoll & tdollSkinData time: ${end - start}ms`);

            const [query] = getQueryParams(ctx.params);
            let replyText = getTDollSkinReplyText(
                query,
                tdollData,
                tdollSkinData
            );
            replyText += `\n${TDOLL_SKIN_END_TEXT}`;

            await ctx.reply(replyText);
        } catch (error) {
            logger.error(`TDollSkin command error: ${error}`);
            await ctx.reply('查询失败，请稍后重试');
        }
    },
};
