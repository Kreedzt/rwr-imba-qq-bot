import { NoticeExecCtx } from "../types";

const template = '欢迎来到 RWR Imba Server 群!\n' +
    '本群提供诸多 Mod 的 rwr 托管服务器, 相关主要连接如下:\n' +
    'GFLNP 文档: https://www.yuque.com/zhaozisong/rwr-gfl-imba \n' +
    'Azur Lane 文档: https://www.yuque.com/zhaozisong/rwr-azur-lane-imba \n' +
    '服务器在线状态: http://42.192.148.161:10010/ \n' +
    '\n' +
    '本群bot 可用 #help 获取使用帮助';

export const welcomeNewMember = async (ctx: NoticeExecCtx) => {
    await ctx.reply(template);
}