import * as fs from 'fs';
import {
    calcCanvasTextWidth,
    getCountColor,
    getMapShortName,
    getMapTextInCanvas,
    getPlayersInServer,
    getServerInfoDisplaySectionText,
    getServersHeaderDisplaySectionText,
    getUserMatchedServerDisplaySectionText,
    getWhereisFooterSectionText,
    getWhereisHeaderSectionText,
} from './utils';
import {
    IMapDataItem,
    IUserMatchedServerItem,
    OnlineServerItem,
} from './types';
import { ServersCanvas } from './canvasGroup/serversCanvas';
import { PlayersCanvas } from './canvasGroup/playersCanvas';
import { WhereisCanvas } from './canvasGroup/whereisCanvas';
import { MapsCanvas } from './canvasGroup/mapsCanvas';

const OUTPUT_FOLDER = 'out';

/**
 * Print servers output png
 * @param serverList server list
 * @param fileName output file name
 */
export const printServerListPng = (
    serverList: OnlineServerItem[],
    fileName: string
) => {
    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const outputPath = new ServersCanvas(serverList, fileName).render();

    return outputPath;
};

/**
 * Print players output png
 * @param serverList server list
 * @param fileName output file name
 */
export const printPlayersPng = (
    serverList: OnlineServerItem[],
    fileName: string
): string => {
    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const outputPath = new PlayersCanvas(serverList, fileName).render();

    return outputPath;
};

/**
 * Print whereis output png
 * @param matchList user in server list(matched)
 * @param query query user name
 * @param count total matched count
 * @param fileName output file name
 */
export const printUserInServerListPng = (
    matchList: IUserMatchedServerItem[],
    query: string,
    count: number,
    fileName: string
): string => {
    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const outputPath = new WhereisCanvas(
        matchList,
        query,
        count,
        fileName
    ).render();

    return outputPath;
};

export const printMapPng = (
    serverList: OnlineServerItem[],
    mapData: IMapDataItem[],
    fileName: string
): string => {
    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const outputPath = new MapsCanvas(
        serverList,
        mapData,
        fileName
    ).render();

    return outputPath;
};
