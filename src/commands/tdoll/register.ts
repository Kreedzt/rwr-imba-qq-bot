import { IRegister } from '../../types';
import { TDollSvc } from './services/tdoll.service';
import { TDollSkinSvc } from './services/tdollskin.service';
import { logger } from '../../utils/logger';
import {
    TDOLL2_SKIN_OUTPUT_FILE,
    TDOLL_SKIN_NOT_FOUND_MSG,
} from './types/constants';
import { getStaticHttpPath } from '../../utils/cmdreq';
import { CommandHelper } from './utils/commandHelper';

const createTDollCommand = (name: string, alias: string): IRegister => {
    const getErrorMessage = () => `参数不正确, 示例:
#${name} M4A1
#${name} random (随机返回)
#${name} m4 ar (查询突击步枪)
#${name} random ar (随机突击步枪)`;

    const exec = async (ctx: any) => {
        try {
            if (!(await CommandHelper.validateParams(ctx, 1, 2))) {
                await ctx.reply(getErrorMessage());
                return;
            }

            const [query, query2 = ''] = CommandHelper.getQueryParams(ctx.params);
            const replyText = (await CommandHelper.getTDoll2Reply(ctx, query, query2)) ?? '';
            await ctx.reply(replyText);
        } catch (error) {
            console.error(`[TDollCommand] Error executing command:`, error);
            await ctx.reply('查询过程中发生错误，请稍后重试');
        }
    };

    return {
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
        exec
    };
};

export const TDollCommandRegister = createTDollCommand('tdoll', 'td');

const createTDollSkinCommand = (name: string, alias: string): IRegister => {
    const exec = async (ctx: any) => {
        try {
            if (!(await CommandHelper.validateParams(ctx, 1))) {
                await ctx.reply(`需要1个参数, 示例: #${name} 2`);
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
            
            if (!(query in tdollSkinData)) {
                await ctx.reply(TDOLL_SKIN_NOT_FOUND_MSG);
                return;
            }

            await CommandHelper.printTDollSkin2Png(
                query,
                tdollData,
                tdollSkinData,
                TDOLL2_SKIN_OUTPUT_FILE
            );

            const replyText = `[CQ:image,file=${getStaticHttpPath(
                ctx.env,
                TDOLL2_SKIN_OUTPUT_FILE
            )},cache=0,c=8]`;

            await ctx.reply(replyText);
        } catch (error) {
            await CommandHelper.handleError(ctx, error, name);
            logger.error(`${name} command failed`, { error, ctx });
        }
    };

    return {
        name,
        alias,
        description: '根据武器编号查询皮肤数据, 需要输入一个编号参数.[10s CD]',
        hint: [`查询指定 ID 武器皮肤数据: #${name} 2`],
        timesInterval: 10,
        isAdmin: false,
        exec
    };
};

export const TDollSkinCommandRegister = createTDollSkinCommand('tdollskin', 'ts');
