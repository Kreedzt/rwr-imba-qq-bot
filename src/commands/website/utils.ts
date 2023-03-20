import * as fs from 'fs';
import { GlobalEnv } from "../../types";
import { IWebsiteItem } from './types';

export const getReplyOutput = (env: GlobalEnv) => {
    const fileContent = JSON.parse(fs.readFileSync(env.WEBSITE_FILE, 'utf-8') as string) as IWebsiteItem[];

    let replayContent = '';

    fileContent.forEach(w => {
        replayContent += `${w.name}\n`;
        replayContent += `${w.website}\n`;
        replayContent += '\n';
    });

    return replayContent;
}