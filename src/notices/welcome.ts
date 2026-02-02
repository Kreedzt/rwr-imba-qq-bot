import * as fs from 'fs';
import { NoticeExecCtx } from "../types";

let template = '';

export const welcomeNewMember = async (ctx: NoticeExecCtx) => {
    if (!template) {
        const templateFileName = ctx.env.WELCOME_TEMPLATE;
        const content = fs.readFileSync(templateFileName, 'utf-8');
        template = content;
    }
    await ctx.reply(template);
}
