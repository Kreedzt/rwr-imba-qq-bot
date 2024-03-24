import { createCanvas, registerFont } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import {
    calcCanvasTextWidth,
    getServerInfoDisplaySectionText,
    getServerInfoDisplayText,
    getCountColor,
    getServersHeaderDisplaySectionText,
} from './utils';
import { OnlineServerItem } from './types';

const OUTPUT_FOLDER = 'out';

const getFooterText = (cost: number, endTime: dayjs.Dayjs) => {
    const text =
        'RWR QQ Bot' +
        `(cost=${cost}ms, render time=${endTime.format(
            'YYYY-MM-DD HH:mm:ss'
        )})`;

    return text;
};

export const printPng = (
    title: string,
    content: string[],
    fileName: string
): string => {
    const fnStartTime = dayjs();

    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const titleWidth = 11 * 28 + (title.length - 11) * 14;

    let maxLengthStr = '';
    content.forEach((s) => {
        if (s.length > maxLengthStr.length) {
            maxLengthStr = s;
        }
    });

    const contentOutputWidth = calcCanvasTextWidth(maxLengthStr, 14) + 20;

    const width = Math.max(titleWidth, contentOutputWidth);
    const height = 120 + content.length * 40;

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
    context.fillText(title, 10, 10);

    /**
     * Content
     */
    let nextStartY = 10 + 40 + 10;

    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    /**
     * Render Rect first
     */
    const maxTextInfo = context.measureText(maxLengthStr);
    const maxTextWidth = maxTextInfo.width;
    context.strokeStyle = '#f48225';
    context.rect(10, nextStartY + 10, maxTextWidth + 20, content.length * 40);
    context.stroke();

    content.forEach((s) => {
        /**
         * Render server info text
         */
        context.fillStyle = '#fff';
        context.fillText(s, 20, 10 + nextStartY);

        nextStartY += 40;
    });

    /**
     * Footer
     */
    context.fillStyle = '#fff';
    context.font = 'bold 10pt Consolas';
    context.textAlign = 'left';
    const fnEndTime = dayjs();

    const calcCost = fnEndTime.diff(fnStartTime);
    let footerText =
        'RWR QQ Bot' +
        `(cost=${calcCost}ms, render time=${fnEndTime.format(
            'YYYY-MM-DD HH:mm:ss'
        )})`;
    context.fillText(footerText, 10, nextStartY + 20);

    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
    });

    const outputPath = path.join(process.cwd(), OUTPUT_FOLDER, `./${fileName}`);

    fs.writeFileSync(outputPath, buffer);

    return outputPath;
};

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

    const titleWidth = 11 * 28 + (totalTitle.length - 11) * 14;

    let maxLengthStr = '';
    serverList.forEach((s) => {
        const outputText = getServerInfoDisplayText(s);
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
    context.fillText(titleData.serversTotalSection + titleData.playersTotalStaticSection, 10, 10);
    const titleStaticSectionWidth = context.measureText(titleData.serversTotalSection + titleData.playersTotalStaticSection).width;
    // count
    const allServersCapacity = serverList.reduce(
        (acc, cur) => acc + cur.max_players,
        0
    );
    const allPlayersCount = serverList.reduce(
        (acc, cur) => acc + cur.current_players,
        0
    );
    context.fillStyle = getCountColor(
        allPlayersCount,
        allServersCapacity
    );
    context.fillText(titleData.playersCountSection, 10 + titleStaticSectionWidth, 10);

    /**
     * Content
     */
    let nextStartY = 10 + 40 + 10;

    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    /**
     * Render Rect first
     */
    const maxTextInfo = context.measureText(maxLengthStr);
    const maxTextWidth = maxTextInfo.width;
    context.strokeStyle = '#f48225';
    context.rect(
        10,
        nextStartY + 10,
        maxTextWidth + 20,
        serverList.length * 40
    );
    context.stroke();

    serverList.forEach((s) => {
        /**
         * Render server info text
         */
        context.fillStyle = '#fff';
        const outputSectionText = getServerInfoDisplaySectionText(s);
        context.fillText(outputSectionText.serverSection, 20, 10 + nextStartY);
        const serverSectionWidth = context.measureText(
            outputSectionText.serverSection
        ).width;

        context.fillStyle = getCountColor(s.current_players, s.max_players);
        context.fillText(
            outputSectionText.playersSection,
            20 + serverSectionWidth,
            10 + nextStartY
        );
        const playersSectionWidth = context.measureText(
            outputSectionText.playersSection
        ).width;

        context.fillStyle = '#fff';
        context.fillText(
            outputSectionText.mapSection,
            20 + serverSectionWidth + playersSectionWidth,
            10 + nextStartY
        );

        nextStartY += 40;
    });

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
