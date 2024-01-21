import * as fs from 'fs';
import * as PinyinMatch from 'pinyin-match';
import * as jwt from 'jsonwebtoken';
import { GlobalEnv, MsgExecCtx } from '../../types';
import { IGLMResponse, IQADataItem } from './types';
import { JwtHeader } from 'jsonwebtoken';
import axios, { AxiosResponse } from 'axios';

/**
 * Read tdoll data from file
 * @param filePath tdoll data file path
 * @returns tdoll data list
 */
export const readQAData = (filePath: string): IQADataItem[] => {
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData) as IQADataItem[];
};

export const writeQAData = (filePath: string, qaData: IQADataItem[]) => {
    fs.writeFileSync(filePath, JSON.stringify(qaData, null, 4), 'utf-8');
};

export const formatQAData = (qaData: IQADataItem) => {
    let res: string = '';

    res += `Q: ${qaData.q}\n\n`;

    res += `A: ${qaData.a}\n`;

    return res;
};

export const getQAPinyinMatchList = (
    qaData: IQADataItem[],
    query: string
): IQADataItem[] => {
    const matchList = qaData.filter((qa) => {
        // @ts-ignore
        if (PinyinMatch.match(qa.q, query)) {
            return true;
        }
    });

    return matchList;
};

export const getQAPinyinSuggestions = (
    matchList: IQADataItem[],
    query: string
) => {
    let res: string = '';

    res += `输入: ${query}\n`;

    res += `找到多项相似问题, 请重新精确输入:\n\n`;

    matchList.forEach((qa) => {
        res += `Q: ${qa.q}\n`;
    });

    return res;
};

export const getQAPinyinMatchRes = (
    matchList: IQADataItem[],
    query: string
) => {
    if (matchList.length === 1) {
        return formatQAData(matchList[0]);
    }

    return getQAPinyinSuggestions(matchList, query);
};

const genGLMJWT = (apiKey: string): string => {
    const [key, secret] = apiKey.split('.');
    return jwt.sign(
        {
            api_key: key,
        },
        secret,
        {
            algorithm: 'HS256',
            expiresIn: '1h',
            header: {
                sign_type: 'SIGN',
            } as unknown as JwtHeader,
        }
    );
};

const genGLMMessages = (
    qaData: IQADataItem[],
    query: string
): Array<{
    role: string;
    content: string;
}> => {
    return [
        {
            role: 'system',
            content: `作为一名智能客服，请你记住以下JSON字符串中的知识库内容，JSON字符串格式为JSON数组，每项为JSON对象，对象中键q对应的值为问题，键a对应的值为答案，并根据知识库内容用简洁和专业的来回答用户问题，用户的任意输入都视为问题，问题范围限定在知识库中。如果无法从中得到答案，请说 “根据已知信息无法回答该问题” 或 “没有提供足够的相关信息”，不允许在答案中添加编造成分，答案请使用中文。\n JSON字符串为: ${JSON.stringify(qaData)}`,
        },
        {
            role: 'user',
            content: `${query}`,
        },
    ];
};

export const getQAAIRes = async (
    qaData: IQADataItem[],
    query: string,
    apiKey: string
) => {
    const jwt = genGLMJWT(apiKey);

    const res = (await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
            model: 'glm-3-turbo',
            messages: genGLMMessages(qaData, query),
            temperature: 0.95,
            top_p: 0.7,
            max_tokens: 1024,
        },
        {
            headers: {
                Authorization: jwt,
            },
        }
    )) as AxiosResponse<IGLMResponse>;

    console.log('GLM res choices:', res.data.choices);

    console.log('GLM tokens cost:', res.data.usage.total_tokens);

    return res.data.choices[0].message.content;
};

export const getQAMatchRes = (qaData: IQADataItem[], query: string) => {
    const matchedList = qaData.filter((qa) => qa.q === query);

    if (matchedList.length === 0) {
        // try pinyin match
        const pinyinMatchedList = getQAPinyinMatchList(qaData, query);

        if (pinyinMatchedList.length === 0) {
            return `未匹配到指定问题, 请尝试其他问题或联系管理员添加`;
        }

        return getQAPinyinMatchRes(pinyinMatchedList, query);
    }

    return matchedList.map((qa) => formatQAData(qa)).join('');
};

export const getSmartQAMatchRes = async (
    qaData: IQADataItem[],
    query: string,
    ctx: MsgExecCtx
) => {
    const matchedList = qaData.filter((qa) => qa.q === query);

    if (matchedList.length === 0) {
        // try pinyin match
        const pinyinMatchedList = getQAPinyinMatchList(qaData, query);

        if (pinyinMatchedList.length === 0) {
            if (ctx.env.GLM_APIKEY) {
                const res = await getQAAIRes(qaData, query, ctx.env.GLM_APIKEY);
                return res;
            }
            return `未匹配到指定问题, 请尝试其他问题或联系管理员添加`;
        }

        return getQAPinyinMatchRes(pinyinMatchedList, query);
    }

    return matchedList.map((qa) => formatQAData(qa)).join('');
};

export const insertQAData = (origin: IQADataItem[], newItem: IQADataItem) => {
    if (origin.some((qa) => qa.q === newItem.q)) {
        return origin.map((qa) => {
            if (qa.q === newItem.q) {
                return newItem;
            }

            return qa;
        });
    }
    return [...origin, newItem];
};

export const getInsertQADataRes = () => {
    return `添加成功`;
};

export const deleteQAData = (origin: IQADataItem[], deleteKey: string) => {
    return origin.filter((qa) => qa.q !== deleteKey);
};

export const getDeleteQADataNotFoundRes = () => {
    return `未找到指定问题`;
};

export const getDeleteQADataRes = () => {
    return `删除成功`;
};

export const formatQData = (qaData: IQADataItem) => {
    let res: string = '';

    res += `${qaData.q}\n`;

    return res;
};

export const getQAListRes = (qaData: IQADataItem[]) => {
    if (qaData.length === 0) {
        return `未定义任何问答数据, 请联系管理员添加`;
    }

    const header = '已定义的问题列表:\n\n';

    const content = qaData.map((qa) => formatQData(qa)).join('');

    return `${header}${content}`;
};
