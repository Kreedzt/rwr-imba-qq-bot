import { IRegister } from '../../types';
import { parseIgnoreSpace } from '../../utils/cmd';
import { getAIQAMatchRes } from './utils';

export const AiCommandRegister: IRegister = {
    name: 'ai',
    description: '使用AI模型与知识库内容进行智能问答[20s CD]',
    hint: ['例: #ai 你好'],
    timesInterval: 20,
    isAdmin: false,
    parseParams: (msg: string) => {
        return parseIgnoreSpace(['#ai'], msg);
    },
    exec: async (ctx) => {
        let query: string = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!query) {
                query = inputParam;
            }
        });

        let replyText = '';
        if (!ctx.env.GLM_APIKEY) {
            replyText = '未配置GLM_APIKEY, 无法使用AI模型进行智能问答';
        } else {
            await ctx.reply(
                `正在使用[${ctx.env.GLM_MODEL}]模型查询中, 请耐心等待...`
            );
            replyText = await getAIQAMatchRes(query, ctx);
        }

        await ctx.reply(replyText);
    },
};
