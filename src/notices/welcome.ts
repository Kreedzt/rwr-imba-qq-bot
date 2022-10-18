import * as fs from 'fs';
import * as path from 'path';
import { NoticeExecCtx } from "../types";

let template = '';

export const welcomeNewMember = async (ctx: NoticeExecCtx) => {
    if (!template) {
        const templateFileName = ctx.env.WELCOME_TEMPLATE;
        const content = fs.readFileSync(path.join(__dirname, templateFileName), 'utf-8');
        template = content;
    }
    await ctx.reply(template);
}