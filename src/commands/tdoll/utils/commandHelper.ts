import { ParamsType } from '../../../types';
import { TDollSvc } from '../services/tdoll.service';
import { TDollSkinSvc } from '../services/tdollskin.service';
import { logger } from '../../../utils/logger';
import {
    getMatchedTDollData,
    getMatchedTDollDataWithCategory,
    getTDollDataRes,
    getTDollDataWithCategoryRes,
    getTDollSkinReplyText,
    printTDoll2Png,
    printTDollSkin2Png,
} from './utils';
import {
    TDOLL2_OUTPUT_FILE,
    TDOLL2_SKIN_OUTPUT_FILE,
} from '../types/constants';
import { getStaticHttpPath } from '../../../utils/cmdreq';

export class CommandHelper {
    /**
     * 获取查询参数
     * @param params 参数对象
     * @returns 参数数组
     */
    static getQueryParams(params: ParamsType): string[] {
        return Array.from(params.keys()).map(String);
    }

    /**
     * 验证参数数量
     * @param ctx 上下文对象
     * @param min 最小参数数量
     * @param max 最大参数数量
     * @returns 是否验证通过
     */
    static async validateParams(
        ctx: any,
        min: number,
        max?: number
    ): Promise<boolean> {
        const paramCount = ctx.params.size;
        if (paramCount < min || (max && paramCount > max)) {
            return false;
        }
        return true;
    }

    /**
     * 处理错误
     * @param ctx 上下文对象
     * @param error 错误对象
     * @param commandName 命令名称
     */
    static async handleError(
        ctx: any,
        error: any,
        commandName: string
    ): Promise<void> {
        logger.error(`${commandName} command error`, { error, ctx });
        await ctx.reply('查询失败，请稍后重试');
    }

    /**
     * 获取TDoll回复
     * @param ctx 上下文对象
     * @param query 查询参数1
     * @param query2 查询参数2
     * @returns 回复文本
     */
    static async getTDollReply(
        ctx: any,
        query: string,
        query2?: string
    ): Promise<string | null> {
        const tdollData = await TDollSvc.getData();
        if (query2) {
            return getTDollDataWithCategoryRes(tdollData, query, query2);
        }
        return getTDollDataRes(tdollData, query);
    }

    /**
     * 获取TDoll2回复
     * @param ctx 上下文对象
     * @param query 查询参数1
     * @param query2 查询参数2
     * @returns 回复文本
     */
    static async getTDoll2Reply(
        ctx: any,
        query: string,
        query2?: string
    ): Promise<string | null> {
        const tdollData = await TDollSvc.getData();
        const matchedRes = query2
            ? getMatchedTDollDataWithCategory(tdollData, query, query2)
            : getMatchedTDollData(tdollData, query);

        if (matchedRes.length === 0) {
            await ctx.reply('未找到指定枪名，请检查输入是否有误！');
            return null;
        }

        await printTDoll2Png(query, matchedRes, TDOLL2_OUTPUT_FILE);
        if (matchedRes.length === 1) {
            const tdollSkinData = await TDollSkinSvc.getData();
            await this.printTDollSkin2Png(
                matchedRes[0].id,
                tdollData,
                tdollSkinData,
                TDOLL2_SKIN_OUTPUT_FILE
            );

            return (
                `[CQ:image,file=${getStaticHttpPath(
                    ctx.env,
                    TDOLL2_OUTPUT_FILE
                )},cache=0,c=8]` +
                '\n' +
                `[CQ:image,file=${getStaticHttpPath(
                    ctx.env,
                    TDOLL2_SKIN_OUTPUT_FILE
                )},cache=0,c=8]`
            );
        }
        return `[CQ:image,file=${getStaticHttpPath(
            ctx.env,
            TDOLL2_OUTPUT_FILE
        )},cache=0,c=8]`;
    }

    /**
     * 获取TDoll皮肤回复文本
     * @param query 查询参数
     * @param tdollData TDoll数据
     * @param tdollSkinData TDoll皮肤数据
     * @returns 回复文本
     */
    static getTDollSkinReplyText(
        query: string,
        tdollData: any,
        tdollSkinData: any
    ): string {
        return getTDollSkinReplyText(query, tdollData, tdollSkinData);
    }

    /**
     * 打印TDoll皮肤图片
     * @param query 查询参数
     * @param tdollData TDoll数据
     * @param tdollSkinData TDoll皮肤数据
     * @param outputFile 输出文件路径
     * @returns 输出路径
     */
    static async printTDollSkin2Png(
        query: string,
        tdollData: any,
        tdollSkinData: any,
        outputFile: string
    ): Promise<string> {
        return printTDollSkin2Png(query, tdollData, tdollSkinData, outputFile);
    }
}
