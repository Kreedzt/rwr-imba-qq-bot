import { Canvas, createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import {
    calcCanvasTextWidth,
    getCountColor,
    getServerInfoDisplaySectionText,
    getServersHeaderDisplaySectionText,
    getUserMatchedServerDisplaySectionText,
    getWhereisFooterSectionText,
    getWhereisHeaderSectionText,
} from './utils';
import { IUserMatchedServerItem, OnlineServerItem } from './types';

const OUTPUT_FOLDER = 'out';

const getFooterText = (cost: number, endTime: dayjs.Dayjs) => {
    return (
        'RWR QQ Bot' +
        `(cost=${cost}ms, render time=${endTime.format('YYYY-MM-DD HH:mm:ss')})`
    );
};

const getCanvasOutput = (canvas: Canvas, outPath: string) => {
    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
    });

    const outputPath = path.join(process.cwd(), OUTPUT_FOLDER, `./${outPath}`);

    fs.writeFileSync(outputPath, buffer);

    return outputPath;
};

/**
 * Print servers output png
 * @param serverList server list
 * @param fileName output file name
 */
export const printServerListPng = (
    serverList: OnlineServerItem[],
    fileName: string
): string => {
    const fnStartTime = dayjs();

    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const titleData = getServersHeaderDisplaySectionText(serverList);
    const totalTitle =
        titleData.serversTotalSection +
        titleData.playersTotalStaticSection +
        titleData.playersCountSection;

    const titleWidth = calcCanvasTextWidth(totalTitle, 20) + 20;

    let maxLengthStr = '';
    serverList.forEach((s) => {
        const sectionData = getServerInfoDisplaySectionText(s);
        const outputText =
            sectionData.serverSection + sectionData.playersSection;
        if (outputText.length > maxLengthStr.length) {
            maxLengthStr = outputText;
        }
    });

    const contentOutputWidth = calcCanvasTextWidth(maxLengthStr, 14) + 20;

    const width = Math.max(titleWidth, contentOutputWidth);
    const height = 120 + serverList.length * 40;

    const canvas = createCanvas(width, height);

    const context = canvas.getContext('2d');

    /**
     * Layout
     */
    context.fillStyle = '#451a03';
    context.fillRect(0, 0, width, height);

    /**
     * Header
     */
    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    context.fillStyle = '#fff';
    context.fillText(
        titleData.serversTotalSection + titleData.playersTotalStaticSection,
        10,
        10
    );
    const titleStaticSectionWidth = context.measureText(
        titleData.serversTotalSection + titleData.playersTotalStaticSection
    ).width;
    // count
    const allServersCapacity = serverList.reduce(
        (acc, cur) => acc + cur.max_players,
        0
    );
    const allPlayersCount = serverList.reduce(
        (acc, cur) => acc + cur.current_players,
        0
    );
    context.fillStyle = getCountColor(allPlayersCount, allServersCapacity);
    context.fillText(
        titleData.playersCountSection,
        10 + titleStaticSectionWidth,
        10
    );

    /**
     * Content
     */
    let nextStartY = 10 + 40 + 10;

    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    /**
     * Border start Y
     */
    const rectStartY = nextStartY + 10;

    let maxRectWidth = 0;
    serverList.forEach((s) => {
        /**
         * Render server info text
         */
        context.fillStyle = '#fff';
        const outputSectionText = getServerInfoDisplaySectionText(s);
        // all text, update maxRectWidth
        const allText =
            outputSectionText.serverSection +
            outputSectionText.playersSection +
            outputSectionText.mapSection;
        const allTextWidth = context.measureText(allText).width;
        if (allTextWidth > maxRectWidth) {
            maxRectWidth = allTextWidth;
        }

        // server section
        context.fillText(outputSectionText.serverSection, 20, 10 + nextStartY);
        const serverSectionWidth = context.measureText(
            outputSectionText.serverSection
        ).width;

        // count section
        context.fillStyle = getCountColor(s.current_players, s.max_players);
        context.fillText(
            outputSectionText.playersSection,
            20 + serverSectionWidth,
            10 + nextStartY
        );
        const playersSectionWidth = context.measureText(
            outputSectionText.playersSection
        ).width;

        // map section
        context.fillStyle = '#fff';
        context.fillText(
            outputSectionText.mapSection,
            20 + serverSectionWidth + playersSectionWidth,
            10 + nextStartY
        );

        nextStartY += 40;
    });

    /**
     * Render rect
     */
    const maxTextInfo = context.measureText(maxLengthStr);
    const maxTextWidth = maxTextInfo.width;
    context.strokeStyle = '#f48225';
    context.rect(10, rectStartY, maxRectWidth + 20, serverList.length * 40);
    context.stroke();

    /**
     * Footer
     */
    context.fillStyle = '#fff';
    context.font = 'bold 10pt Consolas';
    context.textAlign = 'left';
    const fnEndTime = dayjs();

    const calcCost = fnEndTime.diff(fnStartTime);
    const footerText = getFooterText(calcCost, fnEndTime);
    context.fillText(footerText, 10, nextStartY + 20);

    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
    });

    const outputPath = path.join(process.cwd(), OUTPUT_FOLDER, `./${fileName}`);

    fs.writeFileSync(outputPath, buffer);

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
    const fnStartTime = dayjs();

    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const titleData = getWhereisHeaderSectionText(query);
    const totalTitle =
        titleData.staticSection +
        titleData.userSection +
        titleData.staticSection2;

    const titleWidth = 11 * 28 + (totalTitle.length - 11) * 14;

    let maxLengthStr = '';
    matchList.forEach((m) => {
        const section = getUserMatchedServerDisplaySectionText(m);
        const outputText =
            section.userSection +
            section.staticSection +
            section.serverCount +
            section.mapSection;
        if (outputText.length > maxLengthStr.length) {
            maxLengthStr = outputText;
        }
    });

    const contentOutputWidth = calcCanvasTextWidth(maxLengthStr, 14) + 20;

    const width = Math.max(titleWidth, contentOutputWidth);
    /**
     * 40: whereis footer height
     */
    const height = 120 + 40 + matchList.length * 40;

    const canvas = createCanvas(width, height);

    const context = canvas.getContext('2d');

    /**
     * Layout
     */
    context.fillStyle = '#451a03';
    context.fillRect(0, 0, width, height);

    /**
     * Header
     */
    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';

    // static section
    context.fillStyle = '#fff';
    context.fillText(titleData.staticSection, 10, 10);
    const titleStaticSectionWidth = context.measureText(
        titleData.staticSection
    ).width;

    // user section
    context.fillStyle = '#22d3ee';
    context.fillText(titleData.userSection, 10 + titleStaticSectionWidth, 10);
    const titleUserSectionWidth = context.measureText(
        titleData.userSection
    ).width;

    // static section 2
    context.fillStyle = '#fff';
    context.fillText(
        titleData.staticSection2,
        10 + titleStaticSectionWidth + titleUserSectionWidth,
        10
    );

    /**
     * Content
     */
    let nextStartY = 10 + 40 + 10;

    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    /**
     * Border start Y
     */
    const rectStartY = nextStartY + 10;

    let maxRectWidth = 0;
    matchList.forEach((m) => {
        /**
         * Render user in server info text
         */
        const outputSectionText = getUserMatchedServerDisplaySectionText(m);
        // all text, update maxRectWidth
        const allText =
            outputSectionText.userSection +
            outputSectionText.staticSection +
            outputSectionText.serverCount +
            outputSectionText.mapSection;
        const allTextWidth = context.measureText(allText).width;
        if (allTextWidth > maxRectWidth) {
            maxRectWidth = allTextWidth;
        }

        // user section
        context.fillStyle = '#22d3ee';
        context.fillText(outputSectionText.userSection, 20, 10 + nextStartY);
        const userSectionWidth = context.measureText(
            outputSectionText.userSection
        ).width;

        // user + server static section(xxx is playing server1)
        context.fillStyle = '#fff';
        context.fillText(
            outputSectionText.staticSection,
            20 + userSectionWidth,
            10 + nextStartY
        );
        const staticSectionWidth = context.measureText(
            outputSectionText.staticSection
        ).width;

        // server capacity count section
        context.fillStyle = getCountColor(
            m.server.current_players,
            m.server.max_players
        );
        context.fillText(
            outputSectionText.serverCount,
            20 + userSectionWidth + staticSectionWidth,
            10 + nextStartY
        );
        const serverCountWidth = context.measureText(
            outputSectionText.serverCount
        ).width;

        // server map section
        context.fillStyle = '#fff';
        context.fillText(
            outputSectionText.mapSection,
            20 + userSectionWidth + staticSectionWidth + serverCountWidth,
            10 + nextStartY
        );

        nextStartY += 40;
    });

    /**
     * Render rect
     */
    const maxTextInfo = context.measureText(maxLengthStr);
    const maxTextWidth = maxTextInfo.width;
    context.strokeStyle = '#f48225';
    context.rect(10, rectStartY, maxRectWidth + 20, matchList.length * 40);
    context.stroke();

    const footerData = getWhereisFooterSectionText(count);
    context.fillStyle = '#fff';
    context.font = 'bold 10pt Consolas';
    context.textAlign = 'left';
    context.fillText(footerData, 10, nextStartY + 20);
    nextStartY += 40;

    /**
     * Footer
     */
    context.fillStyle = '#fff';
    context.font = 'bold 10pt Consolas';
    context.textAlign = 'left';
    const fnEndTime = dayjs();

    const calcCost = fnEndTime.diff(fnStartTime);
    const footerText = getFooterText(calcCost, fnEndTime);
    context.fillText(footerText, 10, nextStartY + 20);

    return getCanvasOutput(canvas, fileName);
};
