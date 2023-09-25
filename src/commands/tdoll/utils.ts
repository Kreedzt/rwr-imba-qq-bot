import * as fs from 'fs';
import { GlobalEnv } from '../../types';
import { ITDollDataItem } from './types';

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

    res += `${tdoll.编号} ${tdoll.枪名} ${tdoll.枪种}\n`;
    res += `${tdoll.link}\n`;

    return res;
};

export const getTdollDataRes = (
    dataList: ITDollDataItem[],
    query: string
): string => {
    const targetData = dataList
        .filter((d) => {
            const userInput = query
                .toLowerCase()
                .replace('-', '')
                .replace('.', '');

            const currentName = d['枪名']
                .toLowerCase()
                .replace('-', '')
                .replace(' ', '')
                .replace('.', '');

            return currentName.includes(userInput);
        })
        .sort((a, b) => {
            const aMatch = a['枪名'];
            const bMatch = b['枪名'];
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

    const endText = `\n最多展示 5 项结果`;

    return allFormattedData + endText;
};
