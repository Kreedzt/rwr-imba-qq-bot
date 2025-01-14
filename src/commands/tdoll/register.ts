import { IRegister, ParamsType } from '../../types';
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
import { CommandHelper } from './utils/commandHelper';

// 工具函数移动到 commandHelper.ts

/**
 * 创建TDoll命令
 * @param name 命令名称
 * @param alias 命令别名
 * @param isV2 是否使用V2版本
 * @returns IRegister
 */
const createTDollCommand = (
    name: string,
    alias: string,
    isV2 = false
): IRegister => {
    const description =
        '根据枪名查询数据, 支持模糊匹配, 忽略大小写及符号.[10s CD]';
    const hints = [
        `按名称查询指定武器数据: #${alias} M4A1`,
        `按名称模糊查询武器数据: #${alias} m4`,
        `随机武器: #${alias} random`,
        `随机 AR 武器: #${alias} random ar`,
    ];

    return {
        name,
        alias,
        description,
        hint: hints,
        timesInterval: 10,
        isAdmin: false,
        exec: async (ctx) => {
            try {
                // 参数校验
                if (!(await CommandHelper.validateParams(ctx, 1, 2))) {
                    await ctx.reply(
                        `参数不正确, 示例: #${name} M4A1, #${name} random(random 为随机返回), #${name} m4 ar(查询突击步枪), #${name} random ar(随机突击步枪)`
                    );
                    return;
                }

                const [query, query2] = CommandHelper.getQueryParams(
                    ctx.params
                );
                let replyText: string | null = null;

                if (isV2) {
                    replyText = await CommandHelper.getTDoll2Reply(
                        ctx,
                        query,
                        query2
                    );
                } else {
                    replyText = await CommandHelper.getTDollReply(
                        ctx,
                        query,
                        query2
                    );
                    if (replyText && name === 'tdoll0') {
                        replyText +=
                            '\n\n 注意: #tdoll0 命令将在 2 个功能版本后移除, 后续请使用 #tdoll 命令查询数据.';
                    }
                }

                if (replyText) {
                    await ctx.reply(replyText);
                }
            } catch (error) {
                await CommandHelper.handleError(ctx, error, name);
                logger.error(`Command ${name} execution failed`, {
                    error,
                    ctx,
                });
            }
        },
    };
};

export const TDoll0CommandRegister = createTDollCommand('tdoll0', 'td0');
export const TDollCommandRegister = createTDollCommand('tdoll', 'td', true);

export const TDollSkin0CommandRegister: IRegister = {
    name: 'tdollskin0',
    alias: 'ts0',
    description: '根据武器编号查询皮肤数据, 需要输入一个编号参数.[10s CD]',
    hint: ['查询指定 ID 武器皮肤数据: #tdollskin0 2'],
    timesInterval: 10,
    isAdmin: false,
    exec: async (ctx) => {
        try {
            if (!(await CommandHelper.validateParams(ctx, 1))) {
                await ctx.reply('需要1个参数, 示例: #tdollskin0 2');
                return;
            }

            const start = Date.now();
            const [tdollData, tdollSkinData] = await Promise.all([
                TDollSvc.getData(),
                TDollSkinSvc.getData(),
            ]);
            logger.info('Fetched tdoll & tdollSkinData', {
                duration: Date.now() - start,
                tdollCount: tdollData.length,
                skinCount: Object.keys(tdollSkinData).length,
            });

            const [query] = CommandHelper.getQueryParams(ctx.params);
            let replyText = CommandHelper.getTDollSkinReplyText(
                query,
                tdollData,
                tdollSkinData
            );
            replyText += `\n${TDOLL_SKIN_END_TEXT}\n\n注意: #tdollskin0 命令即将在 2 个功能版本后移除, 后续请使用 #tdollskin 命令查询数据.`;

            await ctx.reply(`${replyText}\n${TDOLL_SKIN_END_TEXT}`);
        } catch (error) {
            await CommandHelper.handleError(ctx, error, 'tdollskin0');
            logger.error('TDollSkin0 command failed', { error, ctx });
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
            if (!(await CommandHelper.validateParams(ctx, 1))) {
                await ctx.reply('需要1个参数, 示例: #tdollskin 2');
                return;
            }

            const start = Date.now();
            const [tdollData, tdollSkinData] = await Promise.all([
                TDollSvc.getData(),
                TDollSkinSvc.getData(),
            ]);
            logger.info('Fetched tdoll & tdollSkinData', {
                duration: Date.now() - start,
                tdollCount: tdollData.length,
                skinCount: Object.keys(tdollSkinData).length,
            });

            const [query] = CommandHelper.getQueryParams(ctx.params);
            let replyText = TDOLL_SKIN_NOT_FOUND_MSG;

            if (query in tdollSkinData) {
                await CommandHelper.printTDollSkin2Png(
                    query,
                    tdollData,
                    tdollSkinData,
                    TDOLL2_SKIN_OUTPUT_FILE
                );
                replyText = `[CQ:image,file=${getStaticHttpPath(
                    ctx.env,
                    TDOLL2_SKIN_OUTPUT_FILE
                )},cache=0,c=8]`;
            }

            await ctx.reply(replyText);
        } catch (error) {
            await CommandHelper.handleError(ctx, error, 'tdollskin');
            logger.error('TDollSkin command failed', { error, ctx });
        }
    },
};
