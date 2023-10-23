import * as fs from 'fs';
import { GlobalEnv } from '../../types';
import { ITDollDataItem } from './types';
import { TDOLL_URL_PREFIX } from './constants';

/**
 * Read tdoll data from file
 * @param filePath tdoll data file path
 * @returns tdoll data list
 */
export const readTdollData = (filePath: string): ITDollDataItem[] => {
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData) as ITDollDataItem[];
};

/**
 * Get tdollData formatted message
 * @param tdoll tdoll data
 */
export const formatTDollData = (tdoll: ITDollDataItem) => {
    let res = '';

    res += `No.${tdoll.id} ${tdoll.nameIngame}${
        tdoll.mod === '1' ? '(mod)' : ''
    } ${tdoll.type}\n`;
    res += `${TDOLL_URL_PREFIX}${tdoll.url}\n`;

    return res;
};

export const getTDollDataEndText = () => {
    return `\n最多展示 5 项结果`;
};

export const getTdollDataRes = (
    dataList: ITDollDataItem[],
    query: string
): string => {
    const targetData = dataList
        .filter((d) => {
            const userInput = query
                .toLowerCase()
                .replaceAll('-', '')
                .replaceAll('.', '');

            const currentName = d.nameIngame
                .toLowerCase()
                .replaceAll('-', '')
                .replaceAll(' ', '')
                .replaceAll('.', '');

            return currentName.includes(userInput);
        })
        .sort((a, b) => {
            const aMatch = a.nameIngame;
            const bMatch = b.nameIngame;
            if (aMatch.indexOf(query) !== bMatch.indexOf(query)) {
                return aMatch.indexOf(query) - bMatch.indexOf(query);
            }

            return aMatch.length - bMatch.length;
        });

    const slicedData = targetData.slice(0, 5);

    if (slicedData.length === 0) {
        return `未找到指定枪名, 请检查输入是否有误!`;
    }

    const allFormattedData = slicedData
        .map((tdoll) => formatTDollData(tdoll))
        .join('');

    const endText = getTDollDataEndText();

    return allFormattedData + endText;
};
