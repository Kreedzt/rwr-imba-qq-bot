import { IRegister } from '../../types';
import { IQADataItem } from './types';
import {
    deleteQAData,
    getDeleteQADataNotFoundRes,
    getDeleteQADataRes,
    getInsertQADataRes,
    getQAListRes,
    getQAMatchRes,
    insertQAData,
    readQAData,
    writeQAData,
} from './utils';

let qaData: IQADataItem[] = [];

export const QACommandRegister: IRegister = {
    name: 'qa',
    alias: 'q',
    description: '根据定义好的问答列表问题查询答案, 需要一个参数.[10s CD](模糊匹配, 支持拼音缩写及全拼)',
    timesInterval: 10,
    isAdmin: false,
    exec: async (ctx) => {
        if (qaData.length === 0) {
            qaData = readQAData(ctx.env.QA_DATA_FILE);
        }

        if (ctx.params.size === 0) {
            await ctx.reply(getQAListRes(qaData));
            return;
        }

        let query: string = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!query) {
                query = inputParam;
            }
        });

        const replayText = getQAMatchRes(qaData, query);

        await ctx.reply(replayText);
    },
};

export const QADefineCommandRegister: IRegister = {
    name: 'qadefine',
    description: '定义 qa 的问答列表',
    timesInterval: 0,
    isAdmin: true,
    parseParams: (msg: string) => {
        const step1Msg = msg.replace('#qadefine', '');
        // skip first space
        let skipped = true;
        let targetAnswer = '';

        const params = new Map<string, boolean>();

        let hasAnswerStart = false;
        step1Msg.split(' ').forEach((userInput) => {
            if (userInput === '' && skipped) {
                skipped = false;
            } else if (userInput === '') {
                if (hasAnswerStart) {
                    targetAnswer += ' ';
                }
            } else {
                if (hasAnswerStart) {
                    targetAnswer += ' ' + userInput;
                } else {
                    params.set(userInput, true);
                    hasAnswerStart = true;
                }

                if (params.size !== 0) {
                    hasAnswerStart = true;
                }
            }
        });

        if (targetAnswer) {
            params.set(targetAnswer, true);
        }

        return params;
    },
    exec: async (ctx) => {
        if (ctx.params.size !== 2) {
            await ctx.reply('需要2个参数, 示例: #qadefine 问题 答案');
            return;
        }

        if (qaData.length === 0) {
            qaData = readQAData(ctx.env.QA_DATA_FILE);
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
        });

        const newData = insertQAData(qaData, {
            q: question,
            a: answer,
        });

        writeQAData(ctx.env.QA_DATA_FILE, newData);

        qaData = newData;

        await ctx.reply(getInsertQADataRes());
    },
};

export const QADeleteCommandRegister: IRegister = {
    name: 'qadelete',
    description: '删除 qa 的问答',
    timesInterval: 0,
    isAdmin: true,
    exec: async (ctx) => {
        if (ctx.params.size !== 1) {
            await ctx.reply('需要1个参数, 示例: #qadelete Question1');
            return;
        }

        if (qaData.length === 0) {
            qaData = readQAData(ctx.env.QA_DATA_FILE);
        }

        let question: string = '';

        ctx.params.forEach((checked, inputParam) => {
            if (!question) {
                question = inputParam;
                return;
            }
        });

        const newData = deleteQAData(qaData, question);

        if (newData.length === qaData.length) {
            await ctx.reply(getDeleteQADataNotFoundRes());
            return;
        }

        writeQAData(ctx.env.QA_DATA_FILE, newData);

        qaData = newData;

        await ctx.reply(getDeleteQADataRes());
    },
};
