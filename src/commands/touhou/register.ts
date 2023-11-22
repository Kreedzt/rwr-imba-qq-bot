import * as _ from 'lodash';
import { logger } from "../../utils/logger";
import { IRegister } from "../../types";
import { getImgInfo } from './utils';

export const TouhouCommandRegister: IRegister = {
    name: 'touhou',
    description: '获取随机东方Project图片[30s CD]',
    timesInterval: 30,
    isAdmin: false,
    exec: async (ctx) => {
        const res = await getImgInfo();

        logger.info('> touhou res:', res);


        let descText = '';

        descText += `作者:${res.author}\n`;
        descText += `来源:${res.url}\n`;
        descText += `[CQ:image,file=${res.url}]`;

        await ctx.reply(descText);
    }
}
