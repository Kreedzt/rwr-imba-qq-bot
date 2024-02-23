import * as fs from 'fs';
import { GlobalEnv } from '../../types';
import { ITDollDataItem, ITDollSkinDataItem } from './types';
import { TDOLL_URL_PREFIX } from './constants';
import { resizeImg } from '../../utils/imgproxy';

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

    const avatarUrl = resizeImg(tdoll.avatar, 40, 40);

    res += `No.${tdoll.id} ${tdoll.nameIngame}${
        tdoll.mod === '1' ? '(mod)' : ''
    } ${tdoll.type}\n[CQ:image,file=${avatarUrl},cache=0]`;

    if (tdoll.mod === '1' && tdoll.avatarMod) {
        const modAvatarUrl = resizeImg(tdoll.avatarMod, 40, 40);
        res += `[CQ:image,file=${modAvatarUrl},cache=0]`;
    }

    return res;
};

export const getTDollDataEndText = () => {
    return `\n最多展示 10 项结果`;
};

export const getTDollDataRes = (
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

    const slicedData = targetData.slice(0, 10);

    if (slicedData.length === 0) {
        return `未找到指定枪名, 请检查输入是否有误!`;
    }

    const allFormattedData = slicedData
        .map((tdoll) => formatTDollData(tdoll))
        .join('\n');

    const endText = getTDollDataEndText();

    return allFormattedData + endText;
};

export const formatTDollSkinData = (
    query: string,
    dollData: ITDollDataItem[],
    skin: ITDollSkinDataItem
): string => {
    const targetTDoll = dollData.find((d) => d.id === query);
    let res = `No.${query} ${targetTDoll?.nameIngame || ''} \n`;

    skin.forEach((item) => {
        res += `${item.index + 1}. ${item.title} ID:${item.value}\n`;
    });

    return res;
};

/**
 * Read tdoll skin data from file
 * @param filePath tdoll data file path
 * @returns tdoll data list
 */
export const readTdollSkinData = (
    filePath: string
): Record<string, ITDollSkinDataItem> => {
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData) as Record<string, ITDollSkinDataItem>;
};

export const getTDollSkinReplyText = (
    query: string,
    tdollData: ITDollDataItem[],
    record: Record<string, ITDollSkinDataItem>
) => {
    if (!(query in record)) {
        return '未找到指定人形编号的皮肤, 请检查输入是否有误!';
    }

    const skin = record[query];

    return formatTDollSkinData(query, tdollData, skin);
};
