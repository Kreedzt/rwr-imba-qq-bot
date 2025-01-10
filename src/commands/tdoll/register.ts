import { IRegister, ParamsType } from '../../types';
import {
    getMatchedTDollData,
    getMatchedTDollDataWithCategory,
    getTDollDataRes,
    getTDollDataWithCategoryRes,
    getTDollSkinReplyText,
    printTDoll2Png,
    printTDollSkin2Png,
} from './utils/utils';
import { TDollSvc } from './services/tdoll.service';
import { TDollSkinSvc } from './services/tdollskin.service';
import { logger } from '../../utils/logger';
import {
    TDOLL2_OUTPUT_FILE,
    TDOLL2_SKIN_OUTPUT_FILE,
    TDOLL_SKIN_END_TEXT,
    TDOLL_SKIN_NOT_FOUND_MSG,
} from './types/constants';
import { getStaticHttpPath } from '../../utils/cmdreq';

// 工具函数
const getQueryParams = (params: ParamsType): string[] =>
    Array.from(params.keys()).map(String);

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

const handleError = async (ctx: any, error: any, commandName: string) => {
    logger.error(`${commandName} command error: ${error}`);
    await ctx.reply('查询失败，请稍后重试');
};

const getTDollReply = async (ctx: any, query: string, query2?: string) => {
    const tdollData = await TDollSvc.getData();
    if (query2) {
        return getTDollDataWithCategoryRes(tdollData, query, query2);
    }
    return getTDollDataRes(tdollData, query);
};

const getTDoll2Reply = async (ctx: any, query: string, query2?: string) => {
    const tdollData = await TDollSvc.getData();
    const matchedRes = query2
        ? getMatchedTDollDataWithCategory(tdollData, query, query2)
        : getMatchedTDollData(tdollData, query);

    if (matchedRes.length === 0) {
        await ctx.reply('未找到指定枪名，请检查输入是否有误！');
        return null;
    }

    await printTDoll2Png(query, matchedRes, TDOLL2_OUTPUT_FILE);
    return `[CQ:image,file=${getStaticHttpPath(
        ctx.env,
        TDOLL2_OUTPUT_FILE
    )},cache=0,c=8]`;
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
        try {
            if (ctx.params.size < 1 || ctx.params.size > 2) {
                await ctx.reply(
                    '参数不正确, 示例: #tdoll M4A1, #tdoll random(random 为随机返回), #tdoll m4 ar(查询突击步枪), #tdoll random ar(随机突击步枪)'
                );
                return;
            }

            const [query, query2] = getQueryParams(ctx.params);
            const replyText =
                (await getTDollReply(ctx, query, query2)) +
                '\n 注意: #tdoll2 命令即将在 2 个功能版本后替换 #tdoll 命令, 可尝鲜使用 #tdoll2 命令查询数据, 后续 #tdoll 命令输出调整为 #tdoll2 命令输出格式.';
            if (replyText) {
                await ctx.reply(replyText);
            }
        } catch (error) {
            await handleError(ctx, error, name);
        }
    },
});

export const TDollCommandRegister = createTDollCommand('tdoll', 'td');
export const TDoll2CommandRegister: IRegister = {
    name: 'tdoll2',
    alias: 'td2',
    description: '根据枪名查询数据, 支持模糊匹配, 忽略大小写及符号.[10s CD]',
    hint: [
        '按名称查询指定武器数据: #tdoll2 M4A1',
        '按名称模糊查询武器数据: #tdoll2 m4',
        '随机武器: #tdoll2 random',
        '随机 AR 武器: #tdoll2 random ar',
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

            const [query, query2] = getQueryParams(ctx.params);
            const cqOutput = await getTDoll2Reply(ctx, query, query2);
            if (cqOutput) {
                await ctx.reply(cqOutput);
            }
        } catch (error) {
            await handleError(ctx, error, 'tdoll2');
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
            logger.info(
                `fetch tdoll & tdollSkinData time: ${Date.now() - start}ms`
            );

            const [query] = getQueryParams(ctx.params);
            const replyText =
                getTDollSkinReplyText(query, tdollData, tdollSkinData) +
                `\n${TDOLL_SKIN_END_TEXT}`;

            await ctx.reply(replyText);
        } catch (error) {
            await handleError(ctx, error, 'tdollskin');
        }
    },
};

export const TDollSkin2CommandRegister: IRegister = {
    name: 'tdollskin2',
    alias: 'ts2',
    description: '根据武器编号查询皮肤数据, 需要输入一个编号参数.[10s CD]',
    hint: ['查询指定 ID 武器皮肤数据: #tdollskin2 2'],
    timesInterval: 10,
    isAdmin: false,
    exec: async (ctx) => {
        try {
            if (
                !(await validateParams(
                    ctx,
                    1,
                    '需要1个参数, 示例: #tdollskin2 2'
                ))
            ) {
                return;
            }

            const start = Date.now();
            const [tdollData, tdollSkinData] = await Promise.all([
                TDollSvc.getData(),
                TDollSkinSvc.getData(),
            ]);
            logger.info(
                `fetch tdoll & tdollSkinData time: ${Date.now() - start}ms`
            );

            const [query] = getQueryParams(ctx.params);
            // const replyText =
            //     getTDollSkinReplyText(query, tdollData, tdollSkinData) +
            //     `\n${TDOLL_SKIN_END_TEXT}`;

            let replyText = '';
            if (!(query in tdollSkinData)) {
                replyText = TDOLL_SKIN_NOT_FOUND_MSG;
            } else {
                replyText = await printTDollSkin2Png(
                    query,
                    tdollData,
                    tdollSkinData,
                    TDOLL2_SKIN_OUTPUT_FILE
                );
            }

            await ctx.reply(replyText);
        } catch (error) {
            await handleError(ctx, error, 'tdollskin');
        }
    },
};
