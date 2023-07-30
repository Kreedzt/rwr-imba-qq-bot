import { IRegister } from "../../types";
import { IQADataItem } from "./types";
import { getInsertQADataRes, getQAListRes, getQAMatchRes, insertQAData, readQAData, writeQAData } from "./utils";

let qaData: IQADataItem[] = [];

export const QACommandRegister: IRegister = {
    name: "qa",
    description: "根据定义好的问答列表问题查询答案.[10s CD]",
    timesInterval: 10,
    isAdmin: false,
    exec: async (ctx) => {
        if (ctx.params.size !== 1) {
            await ctx.reply('需要一个参数, 示例: #qa 问题');
            return;
        }

        if (qaData.length === 0) {
            qaData = readQAData(ctx.env.TDOLLDATA_FILE);
        }

        let query: string = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!query) {
                query = inputParam;
            }
        })

        const replayText = getQAMatchRes(qaData, query);


        await ctx.reply(replayText);
    }
}

export const QADefineCommandRegister: IRegister = {
    name: "qadefine",
    description: "定义 qa 的问答列表",
    timesInterval: 0,
    isAdmin: true,
    parseParams: (msg: string) => {
        const step1Msg = msg.replace('#qadefine', '');
        let skipped = true;
        let targetName = '';

        const params = new Map<string, boolean>();

        let hasNameStart = false;
        step1Msg.split(' ').forEach((userInput) => {
            if (userInput === '' && skipped) {
                skipped = false;
            } else if (userInput === '') {
                if (hasNameStart) {
                    targetName += ' ';
                }
            } else {
                if (hasNameStart) {
                    targetName += ' ' + userInput;
                } else {
                    targetName += userInput;
                }
                hasNameStart = true;
            }
        });

        if (targetName) {
            params.set(targetName, true);
        }

        return params;
    },
    exec: async (ctx) => {
        if (ctx.params.size !== 2) {
            await ctx.reply('需要2个参数, 示例: #qa 问题 答案');
            return;
        }

        if (qaData.length === 0) {
            qaData = readQAData(ctx.env.QADATA_FILE);
        }

        let question: string = '';
        let answer: string = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!question) {
                question = inputParam;
                return;
            }

            if (!answer) {
                answer = inputParam;
                return;
            }
        })

        const newData = insertQAData(qaData, {
            q: question,
            a: answer
        });

        writeQAData(ctx.env.QADATA_FILE, newData);

        qaData = newData;


        await ctx.reply(getInsertQADataRes());
    }
}

export const QAListCommandRegister: IRegister = {
    name: "qalist",
    description: "列出定义的 qa 的问答列表",
    timesInterval: 10,
    isAdmin: false,
    exec: async (ctx) => {
        if (qaData.length === 0) {
            qaData = readQAData(ctx.env.TDOLLDATA_FILE);
        }

        const replayText = getQAListRes(qaData);


        await ctx.reply(replayText);
    }
}
