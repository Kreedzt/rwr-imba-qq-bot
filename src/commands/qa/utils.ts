import * as fs from 'fs';
import PinyinMatch from 'pinyin-match';
import { GlobalEnv } from '../../types';
import { IQADataItem } from './types';

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
