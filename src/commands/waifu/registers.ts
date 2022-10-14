import * as _ from 'lodash';
import { logger } from "../../logger";
import { IRegister } from "../../types";
import { getImgInfo } from './utils';

export const WaifuCommandRegister: IRegister = {
    name: 'waifu',
    description: '获取 Waifu 来源的图片[30s CD]',
    timesInterval: 30,
    isAdmin: false,
    exec: async (ctx) => {        
        const res = await getImgInfo();

        logger.info('> waifu res:', res);

        const firstImg = res.images[0];

        if (!firstImg) {
            await ctx.reply('未找到图片');
        }

        let descText = '';

        descText += `来源: ${firstImg.source}`;
        descText += `[CQ:image,file=${firstImg.url}]`;

        await ctx.reply(descText);
    }
}
