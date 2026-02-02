import _ from 'lodash';
import { logger } from "../../utils/logger";
import { IRegister } from "../../types";
import { getShortInfo, getShortUrl } from './utils';

export const OnePtCommandRegister: IRegister = {
    name: '1pt',
    description: '获取短链, 需要一个参数[30s CD]',
    timesInterval: 20,
    isAdmin: false,
    exec: async (ctx) => {
        if (ctx.params.size !== 1) {
            await ctx.reply('需要一个参数, 示例: #1pt https://cn.bing.com');
            return;
        }

        let url = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!url) {
                url = inputParam;
            }
        })

        const res = await getShortInfo(url);

        const shortUrl = getShortUrl(res.short);

        const descText = `短链已生成:\n${shortUrl}`;

        await ctx.reply(descText);
    }
}
